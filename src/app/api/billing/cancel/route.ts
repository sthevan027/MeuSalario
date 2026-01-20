import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getStripeProvider } from '@/lib/payments/stripe-provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST - Cancela assinatura (com opção de retenção)
 */
export async function POST(request: Request) {
  try {
    const { cancel_immediately, offer_discount } = (await request.json().catch(() => ({}))) as {
      cancel_immediately?: boolean
      offer_discount?: number
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
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    if (offer_discount && offer_discount > 0 && offer_discount <= 100) {
      return NextResponse.json({
        success: true,
        message: `Oferta de ${offer_discount}% de desconto registrada. Entre em contato com o suporte para aplicar.`,
        applied_discount: offer_discount,
      })
    }

    const stripe = getStripeProvider()

    if (cancel_immediately) {
      await stripe.cancelSubscription(profile.stripe_subscription_id, true)

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          plan: 'free',
          stripe_subscription_id: null,
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada imediatamente.',
      })
    }

    await stripe.cancelSubscription(profile.stripe_subscription_id, false)

    return NextResponse.json({
      success: true,
      message: 'Assinatura será cancelada no final do período atual.',
    })
  } catch (error: unknown) {
    console.error('Cancel subscription error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao cancelar assinatura.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
