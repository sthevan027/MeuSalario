import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getPaymentProvider, getSubscriptionIdColumn } from '@/lib/payments'
import { logAuditEvent } from '@/lib/audit'
import { checkRateLimit, getClientIp, buildRateLimitKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const cancelSchema = z.object({
  cancel_immediately: z.boolean().optional().default(false),
  offer_discount: z.number().min(0).max(100).optional(),
})

/**
 * POST - Cancela assinatura (com opção de retenção)
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}))
    const parsed = cancelSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }
    const { cancel_immediately, offer_discount } = parsed.data

    const supabase = await createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const rl = checkRateLimit(
      buildRateLimitKey('billing', { userId: user.id, ip: getClientIp(request) }),
      { limit: 20, windowSeconds: 60 }
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em instantes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      )
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
      void logAuditEvent({
        userId: user.id,
        action: 'subscription.discount_offered',
        resource: 'subscription',
        resourceId: subscriptionId,
        metadata: { discount: offer_discount },
        ipAddress: getClientIp(request),
      })
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

      void logAuditEvent({
        userId: user.id,
        action: 'subscription.canceled_immediately',
        resource: 'subscription',
        resourceId: subscriptionId,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      })

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada imediatamente.',
      })
    }

    await provider.cancelSubscription(subscriptionId, false)

    void logAuditEvent({
      userId: user.id,
      action: 'subscription.cancel_at_period_end',
      resource: 'subscription',
      resourceId: subscriptionId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

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
