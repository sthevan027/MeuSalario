/**
 * Funções puras auxiliares para processamento de webhooks de pagamento.
 * Separadas do route.ts para permitir testes unitários sem dependências do Next.js.
 */

export function mapWebhookStatus(
  status: string
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'PENDING':
      return 'trialing'
    case 'OVERDUE':
      return 'past_due'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'none'
  }
}

export function planFromWebhookStatus(mapped: string): 'free' | 'pro' {
  return mapped === 'active' || mapped === 'trialing' ? 'pro' : 'free'
}
