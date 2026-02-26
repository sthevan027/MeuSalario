/**
 * Interface abstrata para provedores de pagamento
 * Permite trocar facilmente entre diferentes gateways (Stripe, etc)
 */

export type SubscriptionStatus = 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'CANCELED'

export interface CreateCustomerInput {
  id: string
  name: string
  email: string
  cpfCnpj?: string
}

export interface CreateSubscriptionInput {
  customerId: string
  planId: string
  value: number
  interval: 'month' | 'year'
  /** ID do usuário no app (ex: Supabase user id), usado pelo Stripe em client_reference_id */
  userId?: string
  /** URL base do app (ex: http://localhost:3000) para success/cancel_url do Checkout */
  baseUrl?: string
}

export interface CreateSubscriptionOutput {
  subscriptionId: string
  paymentLink: string
}

export interface WebhookResult {
  userId: string
  status: SubscriptionStatus
  subscriptionId?: string
}

export interface PaymentProvider {
  /**
   * Cria ou retorna um cliente no gateway de pagamento
   */
  createCustomer(user: CreateCustomerInput): Promise<{ customerId: string }>

  /**
   * Cria uma assinatura recorrente e retorna link de pagamento
   */
  createSubscription(data: CreateSubscriptionInput): Promise<CreateSubscriptionOutput>

  /**
   * Cancela uma assinatura
   */
  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void>

  /**
   * Busca informações de uma assinatura
   */
  getSubscription(subscriptionId: string): Promise<{
    id: string
    status: SubscriptionStatus
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    interval: 'month' | 'year'
  } | null>

  /**
   * Processa webhook do gateway e retorna dados normalizados
   */
  handleWebhook(payload: any, headers: Headers): Promise<WebhookResult | null>
}
