import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getStripeProvider } from '@/lib/payments/stripe-provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST - Cria sessão de checkout Stripe e retorna URL de pagamento
 */
export async function POST(request: Request) {
  try {
    const { interval } = (await request.json().catch(() => ({}))) as { interval?: 'month' | 'year' }
    const safeInterval: 'month' | 'year' = interval === 'year' ? 'year' : 'month'

    const supabase = createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    // Busca plano Pro para obter preço
    const { data: plan } = await supabase
      .from('plans')
      .select('price_monthly, price_yearly')
      .eq('id', 'pro')
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plano Pro não encontrado.' }, { status: 404 })
    }

    const planValue = safeInterval === 'month' ? plan.price_monthly : plan.price_yearly

    if (!planValue || planValue <= 0) {
      return NextResponse.json({ error: 'Preço do plano inválido.' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const stripe = getStripeProvider()
    let customerId = profile?.stripe_customer_id ?? null

    if (!customerId) {
      const { customerId: newCustomerId } = await stripe.createCustomer({
        id: user.id,
        name: user.user_metadata?.name || user.email || 'Usuário',
        email: user.email || '',
      })
      customerId = newCustomerId
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const { paymentLink } = await stripe.createSubscription({
      customerId,
      planId: 'pro',
      value: Number(planValue),
      interval: safeInterval,
      userId: user.id,
    })

    await supabase
      .from('profiles')
      .update({ subscription_status: 'trialing' })
      .eq('id', user.id)

    return NextResponse.json({ url: paymentLink })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao processar checkout.'
    return NextResponse.json({
      error: message.includes('STRIPE') ? message : 'Erro ao processar checkout. Verifique se o Stripe está configurado.',
    }, { status: 500 })
  }
}

