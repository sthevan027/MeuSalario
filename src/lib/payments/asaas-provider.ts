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
    const link = await asaasRequest<AsaasPaymentLink>('/paymentLinks', {
      method: 'POST',
      body: JSON.stringify({
        name: `MeuSalário Pro - ${data.interval === 'year' ? 'Anual' : 'Mensal'}`,
        description: data.interval === 'year'
          ? 'Assinatura Pro anual - gráficos, histórico, comparador CLT x PJ e mais.'
          : 'Assinatura Pro mensal - gráficos, histórico, comparador CLT x PJ e mais.',
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
      const subscriptionId = payment.subscription

      // userId vem do externalReference do payment link (não disponível no webhook de pagamento)
      // Precisamos buscar o customer para pegar email e fazer match, ou o subscription tem metadata
      // Asaas não retorna externalReference no webhook de pagamento - precisamos buscar o payment/customer
      const paymentDetail = await asaasRequest<{ customer: string; subscription?: string }>(
        `/payments/${payment.id}`
      )
      const customerId = paymentDetail.customer
      const subId = paymentDetail.subscription || subscriptionId

      if (!subId) return null

      // Buscar subscription para ver se tem externalReference
      const sub = await asaasRequest<{ externalReference?: string }>(`/subscriptions/${subId}`)
      const userId = sub.externalReference

      if (!userId) {
        // Fallback: buscar customer por email e fazer match com profiles
        const customer = await asaasRequest<{ email?: string }>(`/customers/${customerId}`)
        if (!customer?.email) return null
        // Retornamos dados para o webhook handler fazer o match por email
        return {
          userId: `email:${customer.email}`,
          status: 'ACTIVE',
          subscriptionId: subId,
        }
      }

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
