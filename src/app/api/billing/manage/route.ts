import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET - Retorna informações da assinatura atual
 */
export async function GET(request: Request) {
  try {
    const supabase = createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ subscription: null })
    }

    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    const subscription = subscriptions.data[0] || null

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    // Type assertion para acessar propriedades que podem não estar no tipo base
    const sub = subscription as any

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: sub.current_period_end ?? null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        trial_end: sub.trial_end ?? null,
        items: subscription.items.data.map((item) => ({
          price_id: item.price.id,
          interval: item.price.recurring?.interval ?? null,
        })),
      },
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao buscar assinatura.' }, { status: 500 })
  }
}

/**
 * POST - Atualiza assinatura (upgrade/downgrade)
 */
export async function POST(request: Request) {
  try {
    const { action, interval } = (await request.json().catch(() => ({}))) as {
      action?: 'upgrade' | 'downgrade' | 'change_interval'
      interval?: 'month' | 'year'
    }

    if (!action || !['upgrade', 'downgrade', 'change_interval'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
    }

    const supabase = createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Cliente não encontrado no Stripe.' }, { status: 404 })
    }

    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    const subscription = subscriptions.data[0]

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    if (action === 'downgrade') {
      // Cancela a assinatura no final do período
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })

      return NextResponse.json({ success: true, message: 'Assinatura será cancelada no final do período.' })
    }

    if (action === 'change_interval' && interval) {
      try {
        // Muda o intervalo da assinatura (mensal <-> anual)
        const currentItem = subscription.items.data[0]
        
        if (!currentItem) {
          return NextResponse.json({ error: 'Item da assinatura não encontrado.' }, { status: 404 })
        }

        const newPriceId = interval === 'month' 
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY

        if (!newPriceId) {
          return NextResponse.json({ error: 'Price ID não configurado.' }, { status: 500 })
        }

        await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: currentItem.id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'always_invoice', // Pró-rata automático
        })

        return NextResponse.json({ success: true, message: 'Intervalo da assinatura atualizado.' })
      } catch (stripeError: any) {
        console.error('Stripe error changing interval:', stripeError)
        return NextResponse.json(
          { error: stripeError?.message || 'Erro ao alterar intervalo da assinatura.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Ação não implementada.' }, { status: 400 })
  } catch (error: any) {
    console.error('Manage subscription error:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao gerenciar assinatura.' }, { status: 500 })
  }
}
