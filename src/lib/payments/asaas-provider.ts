/**
 * Implementação do provedor de pagamento Asaas
 * Documentação: https://docs.asaas.com/
 */

import type {
  PaymentProvider,
  CreateCustomerInput,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  SubscriptionStatus,
  WebhookResult,
} from './payment-provider'
import { requireEnv } from '@/lib/env'

/**
 * Quando true (padrão), ajusta notificações do cliente no Asaas via API:
 * mantém só e-mail de confirmação de pagamento (PAYMENT_RECEIVED);
 * desativa lembretes, réguas, inadimplência, SMS/Whats etc.
 * Defina false para deixar as preferências padrão do painel Asaas.
 */
export function shouldApplyAsaasReceiptOnlyCustomerEmails(): boolean {
  return process.env.ASAAS_CUSTOMER_EMAILS_ONLY_PAYMENT_RECEIVED !== 'false'
}

type AsaasNotificationRow = {
  id: string
  event: string
  deleted?: boolean
}

/**
 * Lista todas as notificações do cliente (com paginação).
 */
async function listAllCustomerNotifications(customerId: string): Promise<AsaasNotificationRow[]> {
  const all: AsaasNotificationRow[] = []
  let offset = 0
  const limit = 100
  for (;;) {
    const res = await asaasRequest<{
      data?: AsaasNotificationRow[]
      hasMore?: boolean
    }>(`/customers/${customerId}/notifications?limit=${limit}&offset=${offset}`)
    const batch = res.data ?? []
    all.push(...batch)
    if (!res.hasMore || batch.length < limit) break
    offset += limit
  }
  return all
}

/**
 * Só o cliente recebe e-mail em PAYMENT_RECEIVED (pagamento confirmado).
 * Demais eventos (cobrança criada, lembrete, vencido, linha digitável, etc.) ficam off para o cliente.
 * @see https://docs.asaas.com/docs/alterando-notificacoes-de-um-cliente
 */
export async function applyAsaasCustomerReceiptOnlyNotifications(customerId: string): Promise<void> {
  const rows = await listAllCustomerNotifications(customerId)
  const active = rows.filter((n) => n.id && !n.deleted)
  if (active.length === 0) return

  const notifications = active.map((n) => {
    const receiptOnly = n.event === 'PAYMENT_RECEIVED'
    return {
      id: n.id,
      emailEnabledForCustomer: receiptOnly,
      smsEnabledForCustomer: false,
      whatsappEnabledForCustomer: false,
      phoneCallEnabledForCustomer: false,
    }
  })

  await asaasRequest('/notifications/batch', {
    method: 'PUT',
    body: JSON.stringify({
      customer: customerId,
      notifications,
    }),
  })
}

const ASAAS_API_BASE = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://api-sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3'

interface AsaasCustomer {
  id: string
  name: string
  email?: string
  cpfCnpj?: string
}

interface AsaasPaymentLink {
  id: string
  url: string
}

interface AsaasSubscription {
  id: string
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE'
  nextDueDate: string
  cycle: string
}

interface AsaasPayment {
  id: string
  subscription?: string
  customer: string
  status: string
}

interface AsaasWebhookEvent {
  event: string
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

async function asaasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = requireEnv('ASAAS_API_KEY')
  const res = await fetch(`${ASAAS_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey,
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data.errors?.[0] || data
    throw new Error(typeof err === 'string' ? err : (err.description || err.message || JSON.stringify(err)))
  }
  return data as T
}

/**
 * Resolve o userId do app a partir de uma cobrança (pagamento) no Asaas.
 * Retorna `email:xxx` quando só há correspondência por e-mail (mesmo contrato do webhook).
 */
export async function resolveUserIdForAsaasPayment(
  paymentId: string,
  subscriptionIdFromWebhook?: string
): Promise<string | null> {
  const paymentDetail = await asaasRequest<{ customer: string; subscription?: string }>(
    `/payments/${paymentId}`
  )
  const subId = paymentDetail.subscription || subscriptionIdFromWebhook
  if (!subId) {
    const customer = await asaasRequest<{ email?: string }>(`/customers/${paymentDetail.customer}`)
    if (!customer?.email) return null
    return `email:${customer.email}`
  }
  const sub = await asaasRequest<{ externalReference?: string }>(`/subscriptions/${subId}`)
  if (sub.externalReference) return sub.externalReference
  const customer = await asaasRequest<{ email?: string }>(`/customers/${paymentDetail.customer}`)
  if (!customer?.email) return null
  return `email:${customer.email}`
}

export async function getAsaasPaymentStatus(paymentId: string): Promise<string | null> {
  try {
    const p = await asaasRequest<{ status?: string }>(`/payments/${paymentId}`)
    return p.status ?? null
  } catch {
    return null
  }
}

function toSubscriptionStatus(asaasStatus: string): SubscriptionStatus {
  switch (asaasStatus?.toUpperCase()) {
    case 'ACTIVE':
      return 'ACTIVE'
    case 'EXPIRED':
    case 'INACTIVE':
      return 'CANCELED'
    default:
      return 'PENDING'
  }
}

export class AsaasProvider implements PaymentProvider {
  async createCustomer(user: CreateCustomerInput): Promise<{ customerId: string }> {
    const customer = await asaasRequest<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpfCnpj || undefined,
        externalReference: user.id,
      }),
    })
    return { customerId: customer.id }
  }

  async createSubscription(data: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    const baseUrl =
      data.baseUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://meu-salario-lime.vercel.app'
    const successUrl = new URL('/app/conta?success=1', baseUrl).href
    const callback = { successUrl, autoRedirect: true }

    const cycle = data.interval === 'year' ? 'YEARLY' : 'MONTHLY'

    // Usa Payment Links (RECURRENT) para checkout hospedado - usuário escolhe cartão, boleto ou PIX
    const label = data.interval === 'year' ? 'Anual' : 'Mensal'
    const link = await asaasRequest<AsaasPaymentLink>('/paymentLinks', {
      method: 'POST',
      body: JSON.stringify({
        name: `MeuSalário Pro ${label} — R$ ${data.value.toFixed(2)}`,
        description: data.interval === 'year'
          ? `Assinatura Pro anual (R$ ${data.value.toFixed(2)}) — gráficos, histórico, comparador CLT x PJ e mais.`
          : `Assinatura Pro mensal (R$ ${data.value.toFixed(2)}) — gráficos, histórico, comparador CLT x PJ e mais.`,
        value: data.value,
        chargeType: 'RECURRENT',
        subscriptionCycle: cycle,
        billingType: 'UNDEFINED', // Permite cartão, boleto e PIX
        dueDateLimitDays: data.interval === 'year' ? 365 : 30,
        callback,
        externalReference: data.userId || data.customerId,
      }),
    })

    return {
      subscriptionId: link.id,
      paymentLink: link.url,
    }
  }

  async cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void> {
    if (immediately) {
      await asaasRequest(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
    } else {
      await asaasRequest(`/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'INACTIVE' }),
      })
    }
  }

  async getSubscription(subscriptionId: string): Promise<{
    id: string
    status: SubscriptionStatus
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    interval: 'month' | 'year'
  } | null> {
    try {
      const sub = await asaasRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
      const cycle = sub.cycle === 'YEARLY' ? 'year' : 'month'
      return {
        id: sub.id,
        status: toSubscriptionStatus(sub.status),
        currentPeriodEnd: sub.nextDueDate ? new Date(sub.nextDueDate) : null,
        cancelAtPeriodEnd: sub.status === 'INACTIVE',
        interval: cycle,
      }
    } catch {
      return null
    }
  }

  async handleWebhook(payload: string | Buffer, headers: Headers): Promise<WebhookResult | null> {
    const token = process.env.ASAAS_WEBHOOK_TOKEN
    if (token) {
      const received = headers.get('asaas-access-token')
      if (received !== token) return null
    }

    const body = typeof payload === 'string' ? payload : payload.toString()
    const event: AsaasWebhookEvent = JSON.parse(body)

    // PAYMENT_RECEIVED = pagamento confirmado (assinatura ou cobrança única)
    if (event.event === 'PAYMENT_RECEIVED' && event.payment) {
      const payment = event.payment
      const userId = await resolveUserIdForAsaasPayment(payment.id, payment.subscription)
      if (!userId) return null

      const paymentDetail = await asaasRequest<{ subscription?: string }>(`/payments/${payment.id}`)
      const subId = paymentDetail.subscription || payment.subscription
      if (!subId) return null

      return {
        userId,
        status: 'ACTIVE',
        subscriptionId: subId,
      }
    }

    // SUBSCRIPTION_CREATED - assinatura criada (pode ter externalReference)
    if (event.event === 'SUBSCRIPTION_CREATED' && event.subscription) {
      const sub = event.subscription
      const subDetail = await asaasRequest<{ externalReference?: string }>(
        `/subscriptions/${sub.id}`
      )
      const userId = subDetail.externalReference
      if (!userId) return null
      return {
        userId,
        status: toSubscriptionStatus(sub.status),
        subscriptionId: sub.id,
      }
    }

    return null
  }
}

let asaasProviderInstance: AsaasProvider | null = null

export function getAsaasProvider(): AsaasProvider {
  if (!asaasProviderInstance) {
    asaasProviderInstance = new AsaasProvider()
  }
  return asaasProviderInstance
}
