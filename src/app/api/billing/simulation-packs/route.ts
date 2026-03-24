import { NextResponse } from 'next/server'

/**
 * GET /api/billing/simulation-packs
 *
 * Catálogo de pacotes avulsos de créditos (estrutura para checkout futuro).
 * Os créditos serão aplicados via service role / webhook incrementando os
 * campos `profiles.*_remaining` após a confirmação do pagamento.
 *
 * price_cents: null indica que o preço e checkout ainda não estão disponíveis.
 */
export async function GET() {
  return NextResponse.json({
    packs: [
      {
        id: 'sim_5',
        label: '+5 simulações',
        kind: 'simulation',
        quantity: 5,
        currency: 'BRL',
        price_cents: null,
        active: true,
        description: 'Adiciona 5 simulações ao saldo de histórico (mensal, 13º, férias, rescisão)',
      },
      {
        id: 'cmp_5',
        label: '+5 comparações CLT × PJ',
        kind: 'comparison',
        quantity: 5,
        currency: 'BRL',
        price_cents: null,
        active: true,
        description: 'Adiciona 5 comparações CLT × PJ ao saldo',
      },
      {
        id: 'compat_5',
        label: '+5 análises de compatibilidade',
        kind: 'compatibility',
        quantity: 5,
        currency: 'BRL',
        price_cents: null,
        active: true,
        description: 'Adiciona 5 análises de compatibilidade salarial ao saldo',
      },
      {
        id: 'combo_5',
        label: '+5 de cada (combo)',
        kind: 'combo',
        quantity: 5,
        currency: 'BRL',
        price_cents: null,
        active: true,
        description: 'Adiciona 5 simulações + 5 comparações + 5 análises de compatibilidade',
      },
    ],
    premium: {
      plan_id: 'pro',
      label: 'Plano Pro',
      description: 'Uso ilimitado em todas as funcionalidades, sem cotas de créditos',
      unlimited_simulations: true,
      unlimited_comparisons: true,
      unlimited_compatibility: true,
      checkout_path: '/api/billing/checkout',
    },
  })
}
