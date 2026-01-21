import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST - Cancela assinatura (com opção de retenção)
 */
export async function POST(request: Request) {
  try {
    const { cancel_immediately, offer_discount } = (await request.json().catch(() => ({}))) as {
      cancel_immediately?: boolean
      offer_discount?: number // Percentual de desconto para retenção (ex: 20 = 20%)
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
      .select('stripe_customer_id')
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

    // Se há oferta de desconto, aplica cupom antes de cancelar
    if (offer_discount && offer_discount > 0 && offer_discount <= 100) {
      // Cria um cupom de desconto temporário
      const coupon = await stripe.coupons.create({
        percent_off: offer_discount,
        duration: 'once',
        name: `Retention Offer - ${offer_discount}%`,
      })

      // Aplica o cupom na assinatura
      await stripe.subscriptions.update(subscription.id, {
        coupon: coupon.id,
      })

      return NextResponse.json({
        success: true,
        message: `Desconto de ${offer_discount}% aplicado! Sua assinatura continua ativa.`,
        applied_discount: offer_discount,
      })
    }

    // Cancela imediatamente ou no final do período
    if (cancel_immediately) {
      await stripe.subscriptions.cancel(subscription.id)
      return NextResponse.json({ success: true, message: 'Assinatura cancelada imediatamente.' })
    } else {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })
      return NextResponse.json({
        success: true,
        message: 'Assinatura será cancelada no final do período atual.',
      })
    }
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao cancelar assinatura.' }, { status: 500 })
  }
}
