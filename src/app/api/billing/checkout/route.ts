import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getStripe, getProPriceId } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ 
        error: 'Stripe não configurado. Configure STRIPE_SECRET_KEY no arquivo .env.local' 
      }, { status: 500 })
    }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const origin = new URL(request.url).origin

  // Verifica se o usuário já tem assinatura ativa para aplicar trial apenas para novos clientes
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = existingProfile?.subscription_status === 'active' || existingProfile?.subscription_status === 'trialing'
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: getProPriceId(safeInterval), quantity: 1 }],
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    // Trial de 14 dias apenas para novos clientes (sem assinatura ativa)
    subscription_data: hasActiveSubscription ? undefined : {
      trial_period_days: 14,
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      },
    },
    success_url: `${origin}/app/conta?checkout=success`,
    cancel_url: `${origin}/app/conta?checkout=cancel`,
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Erro ao processar checkout. Verifique se o Stripe está configurado.' 
    }, { status: 500 })
  }
}

