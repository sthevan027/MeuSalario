import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getPaymentProvider, getSubscriptionIdColumn } from '@/lib/payments'

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

    const subIdCol = getSubscriptionIdColumn()

    const { data: profile } = await supabase
      .from('profiles')
      .select(subIdCol)
      .eq('id', user.id)
      .single()

    const subscriptionId = (profile as Record<string, string>)?.[subIdCol]

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    if (offer_discount && offer_discount > 0 && offer_discount <= 100) {
      return NextResponse.json({
        success: true,
        message: `Oferta de ${offer_discount}% de desconto registrada. Entre em contato com o suporte para aplicar.`,
        applied_discount: offer_discount,
      })
    }

    const provider = getPaymentProvider()

    if (cancel_immediately) {
      await provider.cancelSubscription(subscriptionId, true)

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          plan: 'free',
          [subIdCol]: null,
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada imediatamente.',
      })
    }

    await provider.cancelSubscription(subscriptionId, false)

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
