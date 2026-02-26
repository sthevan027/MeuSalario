/**
 * Índice do provedor de pagamento Asaas.
 */

import type { PaymentProvider } from './payment-provider'
import { getAsaasProvider } from './asaas-provider'

export function getPaymentProvider(): PaymentProvider {
  return getAsaasProvider()
}

export function getCustomerIdColumn() {
  return 'asaas_customer_id' as const
}

export function getSubscriptionIdColumn() {
  return 'asaas_subscription_id' as const
}
