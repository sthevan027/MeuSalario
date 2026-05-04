import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getPaymentProvider, getCustomerIdColumn } from '@/lib/payments'
import {
  applyAsaasCustomerReceiptOnlyNotifications,
  shouldApplyAsaasReceiptOnlyCustomerEmails,
} from '@/lib/payments/asaas-provider'
import { parsePlanMoney } from '@/lib/billing/plan-price'
import { logAuditEvent } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  interval: z.enum(['month', 'year']).optional().default('month'),
})

/**
 * POST - Cria sessão de checkout e retorna URL de pagamento (Asaas)
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}))
    const parsed = checkoutSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }
    const { interval: safeInterval } = parsed.data

    const supabase = await createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: plan } = await supabase
      .from('plans')
      .select('price_monthly, price_yearly')
      .eq('id', 'pro')
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plano Pro não encontrado.' }, { status: 404 })
    }

    const rawPrice = safeInterval === 'month' ? plan.price_monthly : plan.price_yearly
    const planValue = parsePlanMoney(rawPrice)

    if (planValue == null || planValue <= 0) {
      return NextResponse.json({ error: 'Preço do plano inválido.' }, { status: 500 })
    }

    const provider = getPaymentProvider()
    const customerIdCol = getCustomerIdColumn()

    let customerId: string | null = null

    const { data: profile } = await supabase
      .from('profiles')
      .select(customerIdCol)
      .eq('id', user.id)
      .single()

    customerId = (profile as Record<string, string>)?.[customerIdCol] ?? null

    if (!customerId) {
      try {
        const { customerId: newCustomerId } = await provider.createCustomer({
          id: user.id,
          name: user.user_metadata?.name || user.email || 'Usuário',
          email: user.email || '',
        })
        customerId = newCustomerId
        await supabase
          .from('profiles')
          .update({ [customerIdCol]: customerId })
          .eq('id', user.id)
      } catch {
        // Payment Link cria cliente no fluxo hospedado
      }
    }

    const baseUrl =
      (() => {
        try {
          return new URL(request.url).origin
        } catch {
          return process.env.NEXT_PUBLIC_APP_URL || 'https://meu-salario-lime.vercel.app'
        }
      })()

    if (customerId && shouldApplyAsaasReceiptOnlyCustomerEmails()) {
      try {
        await applyAsaasCustomerReceiptOnlyNotifications(customerId)
      } catch (e) {
        console.warn(
          'Asaas: não foi possível restringir notificações ao e-mail de pagamento confirmado:',
          e
        )
      }
    }

    const { paymentLink } = await provider.createSubscription({
      customerId: customerId || user.id,
      planId: 'pro',
      value: planValue,
      interval: safeInterval,
      userId: user.id,
      baseUrl,
    })

    // Não marcar como 'trialing' aqui — o status só muda após pagamento confirmado via webhook.
    // Setar 'trialing' antes do pagamento causava acesso indevido ao plano Pro.

    void logAuditEvent({
      userId: user.id,
      action: 'checkout.initiated',
      resource: 'subscription',
      metadata: { interval: safeInterval, planId: 'pro' },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ url: paymentLink })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao processar checkout.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
