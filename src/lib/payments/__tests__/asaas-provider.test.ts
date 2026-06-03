import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AsaasProvider,
  applyAsaasCustomerReceiptOnlyNotifications,
  shouldApplyAsaasReceiptOnlyCustomerEmails,
  resolveUserIdForAsaasPayment,
  getAsaasPaymentStatus,
} from '../asaas-provider'

vi.mock('@/lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/env')>()
  return {
    ...actual,
    requireEnv: (key: string) => {
      const val = process.env[key]
      if (!val) throw new Error(`Variável de ambiente obrigatória não configurada: ${key}`)
      return val
    },
  }
})

// ─── helpers ────────────────────────────────────────────────────────────────

function mockFetch(responses: Array<{ ok?: boolean; status?: number; body: unknown }>) {
  let call = 0
  return vi.fn().mockImplementation(async () => {
    const r = responses[call++] ?? responses[responses.length - 1]
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: async () => r.body,
    }
  })
}

// ─── setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  process.env.ASAAS_API_KEY = 'test-api-key'
  process.env.ASAAS_SANDBOX = 'true'
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.ASAAS_API_KEY
  delete process.env.ASAAS_SANDBOX
  delete process.env.ASAAS_WEBHOOK_TOKEN
  delete process.env.ASAAS_CUSTOMER_EMAILS_ONLY_PAYMENT_RECEIVED
})

// ─── shouldApplyAsaasReceiptOnlyCustomerEmails ───────────────────────────────

describe('shouldApplyAsaasReceiptOnlyCustomerEmails', () => {
  it('retorna true por padrão', () => {
    expect(shouldApplyAsaasReceiptOnlyCustomerEmails()).toBe(true)
  })

  it('retorna false quando variável está como "false"', () => {
    process.env.ASAAS_CUSTOMER_EMAILS_ONLY_PAYMENT_RECEIVED = 'false'
    expect(shouldApplyAsaasReceiptOnlyCustomerEmails()).toBe(false)
  })

  it('retorna true para qualquer valor diferente de "false"', () => {
    process.env.ASAAS_CUSTOMER_EMAILS_ONLY_PAYMENT_RECEIVED = 'true'
    expect(shouldApplyAsaasReceiptOnlyCustomerEmails()).toBe(true)
  })
})

// ─── AsaasProvider.createCustomer ───────────────────────────────────────────

describe('AsaasProvider.createCustomer', () => {
  it('cria cliente e retorna customerId', async () => {
    const fetch = mockFetch([{ body: { id: 'cus_abc123', name: 'João Silva', email: 'joao@email.com' } }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    const result = await provider.createCustomer({ id: 'user-1', name: 'João Silva', email: 'joao@email.com' })

    expect(result).toEqual({ customerId: 'cus_abc123' })
    expect(fetch).toHaveBeenCalledOnce()

    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/customers')
    expect(opts.method).toBe('POST')

    const body = JSON.parse(opts.body)
    expect(body.name).toBe('João Silva')
    expect(body.email).toBe('joao@email.com')
    expect(body.externalReference).toBe('user-1')
  })

  it('inclui cpfCnpj quando fornecido', async () => {
    const fetch = mockFetch([{ body: { id: 'cus_xyz', name: 'Maria', email: 'm@email.com' } }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    await provider.createCustomer({ id: 'user-2', name: 'Maria', email: 'm@email.com', cpfCnpj: '123.456.789-00' })

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.cpfCnpj).toBe('123.456.789-00')
  })

  it('lança erro quando API retorna status de falha', async () => {
    const fetch = mockFetch([{
      ok: false,
      status: 400,
      body: { errors: [{ description: 'CPF inválido' }] },
    }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    await expect(provider.createCustomer({ id: 'u', name: 'N', email: 'e@e.com' }))
      .rejects.toThrow('CPF inválido')
  })

  it('lança erro genérico quando resposta de falha não tem errors[]', async () => {
    const fetch = mockFetch([{ ok: false, status: 500, body: { message: 'Internal error' } }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    await expect(provider.createCustomer({ id: 'u', name: 'N', email: 'e@e.com' }))
      .rejects.toThrow('Internal error')
  })
})

// ─── AsaasProvider.createSubscription ───────────────────────────────────────

describe('AsaasProvider.createSubscription', () => {
  it('cria link de pagamento mensal', async () => {
    const fetch = mockFetch([{ body: { id: 'link_month', url: 'https://asaas.com/pay/link_month' } }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    const result = await provider.createSubscription({
      customerId: 'cus_abc',
      planId: 'plan_pro_monthly',
      userId: 'user-1',
      value: 10.0,
      interval: 'month',
      baseUrl: 'https://app.example.com',
    })

    expect(result.subscriptionId).toBe('link_month')
    expect(result.paymentLink).toBe('https://asaas.com/pay/link_month')

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.subscriptionCycle).toBe('MONTHLY')
    expect(body.chargeType).toBe('RECURRENT')
    expect(body.value).toBe(10.0)
    expect(body.callback.successUrl).toContain('/app/conta?success=1')
  })

  it('cria link de pagamento anual', async () => {
    const fetch = mockFetch([{ body: { id: 'link_year', url: 'https://asaas.com/pay/link_year' } }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    await provider.createSubscription({
      customerId: 'cus_abc',
      planId: 'plan_pro_yearly',
      userId: 'user-1',
      value: 95.0,
      interval: 'year',
      baseUrl: 'https://app.example.com',
    })

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.subscriptionCycle).toBe('YEARLY')
    expect(body.name).toContain('Anual')
  })

  it('usa NEXT_PUBLIC_APP_URL quando baseUrl não é fornecido', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://meu-salario.app'
    const fetch = mockFetch([{ body: { id: 'link_env', url: 'https://asaas.com/pay/link_env' } }])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    await provider.createSubscription({
      customerId: 'cus_abc',
      planId: 'plan_pro_monthly',
      userId: 'user-1',
      value: 10.0,
      interval: 'month',
    })

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.callback.successUrl).toContain('meu-salario.app')

    delete process.env.NEXT_PUBLIC_APP_URL
  })
})

// ─── AsaasProvider.handleWebhook ────────────────────────────────────────────

describe('AsaasProvider.handleWebhook', () => {
  it('lança erro quando ASAAS_WEBHOOK_TOKEN não está configurado', async () => {
    delete process.env.ASAAS_WEBHOOK_TOKEN
    vi.stubGlobal('fetch', vi.fn())

    const provider = new AsaasProvider()
    await expect(provider.handleWebhook('{}', new Headers()))
      .rejects.toThrow('ASAAS_WEBHOOK_TOKEN não configurado')
  })

  it('lança erro para token inválido', async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = 'secret-token'
    vi.stubGlobal('fetch', vi.fn())

    const provider = new AsaasProvider()
    const headers = new Headers({ 'asaas-access-token': 'wrong-token' })
    await expect(provider.handleWebhook('{}', headers))
      .rejects.toThrow('Webhook signature inválida')
  })

  it('processa PAYMENT_RECEIVED e retorna userId + status ACTIVE', async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = 'valid-token'
    const fetch = mockFetch([
      // resolveUserIdForAsaasPayment: GET /payments/pay_1 → tem subscription
      { body: { customer: 'cus_1', subscription: 'sub_1' } },
      // GET /subscriptions/sub_1 → tem externalReference
      { body: { externalReference: 'user-uuid-123' } },
      // handleWebhook: GET /payments/pay_1 novamente para pegar subscription
      { body: { subscription: 'sub_1' } },
    ])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    const payload = JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_1', subscription: 'sub_1', customer: 'cus_1', status: 'RECEIVED' },
    })

    const headers = new Headers({ 'asaas-access-token': 'valid-token' })
    const result = await provider.handleWebhook(payload, headers)
    expect(result).toEqual({
      userId: 'user-uuid-123',
      status: 'ACTIVE',
      subscriptionId: 'sub_1',
    })
  })

  it('processa SUBSCRIPTION_CREATED com externalReference', async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = 'valid-token'
    const fetch = mockFetch([
      { body: { externalReference: 'user-uuid-456' } },
    ])
    vi.stubGlobal('fetch', fetch)

    const provider = new AsaasProvider()
    const payload = JSON.stringify({
      event: 'SUBSCRIPTION_CREATED',
      subscription: { id: 'sub_2', status: 'ACTIVE', nextDueDate: '2026-07-01', cycle: 'MONTHLY' },
    })

    const headers = new Headers({ 'asaas-access-token': 'valid-token' })
    const result = await provider.handleWebhook(payload, headers)
    expect(result).toEqual({
      userId: 'user-uuid-456',
      status: 'ACTIVE',
      subscriptionId: 'sub_2',
    })
  })

  it('retorna null para eventos desconhecidos', async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = 'valid-token'
    vi.stubGlobal('fetch', vi.fn())

    const provider = new AsaasProvider()
    const headers = new Headers({ 'asaas-access-token': 'valid-token' })
    const result = await provider.handleWebhook(
      JSON.stringify({ event: 'PAYMENT_OVERDUE' }),
      headers
    )
    expect(result).toBeNull()
  })
})

// ─── applyAsaasCustomerReceiptOnlyNotifications ──────────────────────────────

describe('applyAsaasCustomerReceiptOnlyNotifications', () => {
  it('não faz chamada PUT quando lista de notificações está vazia', async () => {
    const fetch = mockFetch([{ body: { data: [], hasMore: false } }])
    vi.stubGlobal('fetch', fetch)

    await applyAsaasCustomerReceiptOnlyNotifications('cus_empty')
    expect(fetch).toHaveBeenCalledOnce() // só o GET, sem PUT
  })

  it('envia PUT com emailEnabledForCustomer=true apenas para PAYMENT_RECEIVED', async () => {
    const fetch = mockFetch([
      {
        body: {
          data: [
            { id: 'n1', event: 'PAYMENT_RECEIVED' },
            { id: 'n2', event: 'PAYMENT_CREATED' },
            { id: 'n3', event: 'PAYMENT_OVERDUE' },
          ],
          hasMore: false,
        },
      },
      { body: {} }, // PUT response
    ])
    vi.stubGlobal('fetch', fetch)

    await applyAsaasCustomerReceiptOnlyNotifications('cus_123')

    expect(fetch).toHaveBeenCalledTimes(2)
    const [, putOpts] = fetch.mock.calls[1]
    expect(putOpts.method).toBe('PUT')

    const body = JSON.parse(putOpts.body)
    expect(body.customer).toBe('cus_123')

    const n1 = body.notifications.find((n: { id: string }) => n.id === 'n1')
    const n2 = body.notifications.find((n: { id: string }) => n.id === 'n2')
    expect(n1.emailEnabledForCustomer).toBe(true)
    expect(n2.emailEnabledForCustomer).toBe(false)
    expect(n2.smsEnabledForCustomer).toBe(false)
  })
})

// ─── resolveUserIdForAsaasPayment ────────────────────────────────────────────

describe('resolveUserIdForAsaasPayment', () => {
  it('resolve via externalReference da subscription', async () => {
    const fetch = mockFetch([
      { body: { customer: 'cus_1', subscription: 'sub_1' } },
      { body: { externalReference: 'user-uuid-789' } },
    ])
    vi.stubGlobal('fetch', fetch)

    const result = await resolveUserIdForAsaasPayment('pay_1')
    expect(result).toBe('user-uuid-789')
  })

  it('resolve via email quando não há subscription', async () => {
    const fetch = mockFetch([
      { body: { customer: 'cus_1' } }, // sem subscription
      { body: { email: 'user@test.com' } },
    ])
    vi.stubGlobal('fetch', fetch)

    const result = await resolveUserIdForAsaasPayment('pay_no_sub')
    expect(result).toBe('email:user@test.com')
  })

  it('retorna null quando cliente não tem email', async () => {
    const fetch = mockFetch([
      { body: { customer: 'cus_1' } },
      { body: {} }, // sem email
    ])
    vi.stubGlobal('fetch', fetch)

    const result = await resolveUserIdForAsaasPayment('pay_no_email')
    expect(result).toBeNull()
  })
})

// ─── AsaasProvider.cancelSubscription ───────────────────────────────────────

describe('AsaasProvider.cancelSubscription', () => {
  it('envia DELETE quando immediately=true', async () => {
    const fetch = mockFetch([{ ok: true, body: {} }])
    vi.stubGlobal('fetch', fetch)

    await new AsaasProvider().cancelSubscription('sub_123', true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions/sub_123'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('envia PUT com status INACTIVE quando immediately=false', async () => {
    const fetch = mockFetch([{ ok: true, body: {} }])
    vi.stubGlobal('fetch', fetch)

    await new AsaasProvider().cancelSubscription('sub_123', false)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions/sub_123'),
      expect.objectContaining({ method: 'PUT' }),
    )
  })
})

// ─── AsaasProvider.getSubscription ──────────────────────────────────────────

describe('AsaasProvider.getSubscription', () => {
  it('retorna null quando a API retorna erro (ex: 404)', async () => {
    const fetch = mockFetch([{ ok: false, status: 404, body: { errors: [{ description: 'Not found' }] } }])
    vi.stubGlobal('fetch', fetch)

    const result = await new AsaasProvider().getSubscription('sub_nao_existe')
    expect(result).toBeNull()
  })

  it('retorna dados mapeados para assinatura ACTIVE mensal', async () => {
    const fetch = mockFetch([{
      ok: true,
      body: {
        id: 'sub_abc',
        status: 'ACTIVE',
        cycle: 'MONTHLY',
        nextDueDate: '2026-07-01',
        endDate: null,
      },
    }])
    vi.stubGlobal('fetch', fetch)

    const result = await new AsaasProvider().getSubscription('sub_abc')
    expect(result).not.toBeNull()
    expect(result?.status).toBe('ACTIVE')
    expect(result?.interval).toBe('month')
    expect(result?.cancelAtPeriodEnd).toBe(false)
  })

  it('retorna dados mapeados para assinatura INACTIVE anual', async () => {
    const fetch = mockFetch([{
      ok: true,
      body: {
        id: 'sub_xyz',
        status: 'INACTIVE',
        cycle: 'YEARLY',
        nextDueDate: null,
        endDate: '2026-12-31',
      },
    }])
    vi.stubGlobal('fetch', fetch)

    const result = await new AsaasProvider().getSubscription('sub_xyz')
    expect(result).not.toBeNull()
    expect(result?.interval).toBe('year')
    expect(result?.cancelAtPeriodEnd).toBe(true)
  })
})

// ─── getAsaasPaymentStatus ───────────────────────────────────────────────────

describe('getAsaasPaymentStatus', () => {
  it('retorna status do pagamento', async () => {
    const fetch = mockFetch([{ body: { status: 'RECEIVED' } }])
    vi.stubGlobal('fetch', fetch)

    const result = await getAsaasPaymentStatus('pay_1')
    expect(result).toBe('RECEIVED')
  })

  it('retorna null em caso de erro', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', fetch)

    const result = await getAsaasPaymentStatus('pay_err')
    expect(result).toBeNull()
  })
})
