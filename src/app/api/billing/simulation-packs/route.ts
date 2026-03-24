import { NextResponse } from 'next/server'

/**
 * Catálogo de pacotes avulsos de simulações (estrutura para checkout futuro).
 * Os créditos serão aplicados via service role / webhook incrementando `profiles.simulations_remaining`.
 */
export async function GET() {
  return NextResponse.json({
    packs: [
      { id: 'sim_5', label: '+5 simulações', quantity: 5, currency: 'BRL', price_cents: null, active: true },
      { id: 'sim_10', label: '+10 simulações', quantity: 10, currency: 'BRL', price_cents: null, active: true },
    ],
    premium: {
      plan_id: 'pro',
      label: 'Plano Pro',
      unlimited_simulations: true,
      checkout_path: '/api/billing/checkout',
    },
  })
}
