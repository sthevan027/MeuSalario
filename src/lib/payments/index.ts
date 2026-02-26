/**
 * Índice do provedor de pagamento ativo.
 * Define qual gateway usar (asaas ou stripe) via PAYMENT_PROVIDER.
 */

import type { PaymentProvider } from './payment-provider'
import { getAsaasProvider } from './asaas-provider'
import { getStripeProvider } from './stripe-provider'

export type PaymentProviderName = 'asaas' | 'stripe'

function getActiveProviderName(): PaymentProviderName {
  const name = (process.env.PAYMENT_PROVIDER || 'asaas').toLowerCase()
  if (name === 'stripe') return 'stripe'
  return 'asaas'
}

export function getPaymentProvider(): PaymentProvider {
  const name = getActiveProviderName()
  if (name === 'stripe') return getStripeProvider()
  return getAsaasProvider()
}

export function isAsaasActive(): boolean {
  return getActiveProviderName() === 'asaas'
}

export function isStripeActive(): boolean {
  return getActiveProviderName() === 'stripe'
}

export function getCustomerIdColumn(): 'asaas_customer_id' | 'stripe_customer_id' {
  return isAsaasActive() ? 'asaas_customer_id' : 'stripe_customer_id'
}

export function getSubscriptionIdColumn(): 'asaas_subscription_id' | 'stripe_subscription_id' {
  return isAsaasActive() ? 'asaas_subscription_id' : 'stripe_subscription_id'
}
