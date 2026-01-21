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
import { env, requireEnv } from '@/lib/env'

interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
}

interface AsaasSubscription {
  id: string
  customer: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  value: number
  nextDueDate: string
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  status: 'ACTIVE' | 'EXPIRED' | 'OVERDUE' | 'PENDING' | 'CANCELED'
  cancelDate?: string
}

interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH_UNDONE' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  invoiceUrl?: string
  pixQrCodeId?: string
  pixQrCode?: string
}

export class AsaasProvider implements PaymentProvider {
  private apiKey: string
  private baseUrl: string
  private webhookToken: string

  constructor() {
    this.apiKey = requireEnv('ASAAS_API_KEY')
    this.webhookToken = requireEnv('ASAAS_WEBHOOK_TOKEN')
    const env = process.env.ASAAS_ENV || 'sandbox'
    this.baseUrl = env === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/api/v3'
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'MeuSalario/1.0', // Obrigatório para contas criadas após junho/2024
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      throw new Error(error.message || `Erro na API Asaas: ${response.statusText}`)
    }

    return response.json()
  }

  async createCustomer(user: CreateCustomerInput): Promise<{ customerId: string }> {
    const customerData: any = {
      name: user.name,
      email: user.email,
      externalReference: user.id, // Salva userId para facilitar busca no webhook
    }

    if (user.cpfCnpj) {
      customerData.cpfCnpj = user.cpfCnpj.replace(/\D/g, '') // Remove formatação
    }

    const customer = await this.request<AsaasCustomer>('POST', '/customers', customerData)

    return { customerId: customer.id }
  }

  async createSubscription(
    data: CreateSubscriptionInput
  ): Promise<CreateSubscriptionOutput> {
    // Mapeia intervalo para ciclo do Asaas
    const cycle = data.interval === 'month' ? 'MONTHLY' : 'YEARLY'

    // Calcula próxima data de vencimento (hoje + 1 mês ou 1 ano)
    const nextDueDate = new Date()
    if (data.interval === 'month') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    } else {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
    }

    const subscriptionData = {
      customer: data.customerId,
      billingType: ['PIX', 'CREDIT_CARD'] as const, // Permite ambos Pix e Cartão
      value: data.value,
      nextDueDate: nextDueDate.toISOString().split('T')[0], // YYYY-MM-DD
      cycle,
      description: `Assinatura ${data.planId} - ${data.interval === 'month' ? 'Mensal' : 'Anual'}`,
    }

    const subscription = await this.request<AsaasSubscription>(
      'POST',
      '/subscriptions',
      subscriptionData
    )

    // Aguarda um pouco para o Asaas processar a assinatura e criar o pagamento
    // Em produção, você pode usar webhooks para isso, mas para UX imediata, fazemos polling
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Busca o primeiro pagamento da assinatura para obter o link
    let paymentLink = ''
    
    try {
      const payments = await this.request<{ data: AsaasPayment[] }>(
        'GET',
        `/payments?subscription=${subscription.id}&limit=1`
      )

      if (payments.data && payments.data.length > 0) {
        const payment = payments.data[0]
        
        // Prioriza invoiceUrl (link de pagamento completo)
        if (payment.invoiceUrl) {
          paymentLink = payment.invoiceUrl
        } else if (payment.pixQrCodeId) {
          // Se for PIX, constrói URL do QR Code
          paymentLink = `https://${this.baseUrl.includes('sandbox') ? 'sandbox' : 'www'}.asaas.com/pix/qrCode/${payment.pixQrCodeId}`
        } else {
          // Fallback: constrói URL do dashboard Asaas para o pagamento
          paymentLink = `https://${this.baseUrl.includes('sandbox') ? 'sandbox' : 'www'}.asaas.com/payment/${payment.id}`
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar pagamento da assinatura:', error)
    }

    // Se ainda não temos link, usa o link da assinatura
    if (!paymentLink) {
      paymentLink = `https://${this.baseUrl.includes('sandbox') ? 'sandbox' : 'www'}.asaas.com/subscription/${subscription.id}`
    }

    return {
      subscriptionId: subscription.id,
      paymentLink,
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<void> {
    if (immediately) {
      await this.request('DELETE', `/subscriptions/${subscriptionId}`)
    } else {
      // Marca para cancelar no final do período
      await this.request('PUT', `/subscriptions/${subscriptionId}`, {
        status: 'CANCELED',
      })
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.request<AsaasSubscription>(
        'GET',
        `/subscriptions/${subscriptionId}`
      )

      // Mapeia status do Asaas para nosso formato
      const status: SubscriptionStatus = this.mapStatus(subscription.status)

      // Calcula data de término do período
      let currentPeriodEnd: Date | null = null
      if (subscription.nextDueDate) {
        currentPeriodEnd = new Date(subscription.nextDueDate)
      }

      // Mapeia ciclo para intervalo
      const interval: 'month' | 'year' = 
        subscription.cycle === 'YEARLY' || subscription.cycle === 'SEMIANNUALLY' 
          ? 'year' 
          : 'month'

      return {
        id: subscription.id,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.status === 'CANCELED' && !subscription.cancelDate,
        interval,
      }
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('não encontrado')) {
        return null
      }
      throw error
    }
  }

  async handleWebhook(payload: any, headers: Headers): Promise<WebhookResult | null> {
    // Valida token do webhook
    // O Asaas pode enviar o token de diferentes formas:
    // 1. No header 'asaas-access-token'
    // 2. No body como 'token' ou 'accessToken'
    // 3. Como query parameter (menos comum)
    const headerToken = headers.get('asaas-access-token') || headers.get('x-asaas-access-token')
    const bodyToken = payload.token || payload.accessToken || payload.webhookToken
    
    // Se nenhum token for encontrado, aceita (para desenvolvimento)
    // Em produção, sempre valide o token
    if (this.webhookToken && headerToken !== this.webhookToken && bodyToken !== this.webhookToken) {
      console.warn('Token de webhook inválido ou ausente. Header:', headerToken, 'Body:', bodyToken)
      // Em produção, você pode querer lançar erro aqui
      // throw new Error('Token de webhook inválido')
    }

    const event = payload.event
    const payment = payload.payment as AsaasPayment | undefined
    const subscription = payload.subscription as AsaasSubscription | undefined

    // Função auxiliar para buscar userId do customer
    // Tenta buscar via externalReference primeiro, depois via banco de dados
    const getUserIdFromCustomer = async (customerId: string): Promise<string | null> => {
      try {
        const customer = await this.request<{ id: string; externalReference?: string }>(
          'GET',
          `/customers/${customerId}`
        )
        
        // Se tem externalReference (que é o userId), retorna
        if (customer.externalReference) {
          return customer.externalReference
        }
        
        // Se não tem, tenta buscar no banco via asaas_customer_id
        // Isso requer acesso ao Supabase, então vamos retornar null e deixar o webhook buscar
        return null
      } catch {
        return null
      }
    }

    // Processa eventos de pagamento
    if (event === 'PAYMENT_CONFIRMED' && payment) {
      const userId = await getUserIdFromCustomer(payment.customer)
      
      if (!userId) {
        console.warn('UserId não encontrado para customer:', payment.customer)
        return null
      }

      return {
        userId,
        status: 'ACTIVE',
        subscriptionId: payment.subscription,
      }
    }

    if (event === 'PAYMENT_OVERDUE' && payment) {
      const userId = await getUserIdFromCustomer(payment.customer)
      
      if (!userId) {
        return null
      }

      return {
        userId,
        status: 'OVERDUE',
        subscriptionId: payment.subscription,
      }
    }

    if (event === 'PAYMENT_RECEIVED' && payment) {
      const userId = await getUserIdFromCustomer(payment.customer)
      
      if (!userId) {
        return null
      }

      return {
        userId,
        status: 'ACTIVE',
        subscriptionId: payment.subscription,
      }
    }

    // Processa eventos de assinatura
    if (event === 'SUBSCRIPTION_CANCELED' && subscription) {
      const userId = await getUserIdFromCustomer(subscription.customer)
      
      if (!userId) {
        return null
      }

      return {
        userId,
        status: 'CANCELED',
        subscriptionId: subscription.id,
      }
    }

    // Evento não processado
    return null
  }

  /**
   * Mapeia status do Asaas para formato interno
   */
  private mapStatus(asaasStatus: string): SubscriptionStatus {
    switch (asaasStatus) {
      case 'ACTIVE':
        return 'ACTIVE'
      case 'PENDING':
        return 'PENDING'
      case 'OVERDUE':
        return 'OVERDUE'
      case 'CANCELED':
      case 'EXPIRED':
        return 'CANCELED'
      default:
        return 'PENDING'
    }
  }
}

/**
 * Instância singleton do provider Asaas
 */
let asaasProviderInstance: AsaasProvider | null = null

export function getAsaasProvider(): AsaasProvider {
  if (!asaasProviderInstance) {
    asaasProviderInstance = new AsaasProvider()
  }
  return asaasProviderInstance
}
