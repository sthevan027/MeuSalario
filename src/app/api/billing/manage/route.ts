import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import {
  getPaymentProvider,
  getSubscriptionIdColumn,
  getCustomerIdColumn,
} from '@/lib/payments'
import { parsePlanMoney } from '@/lib/billing/plan-price'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET - Retorna informações da assinatura atual
 */
export async function GET() {
  try {
    const supabase = await createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const subIdCol = getSubscriptionIdColumn()

    const { data: profile } = await supabase
      .from('profiles')
      .select(`${subIdCol}, subscription_status`)
      .eq('id', user.id)
      .single()

    const subscriptionId = (profile as Record<string, string>)?.[subIdCol]

    if (!subscriptionId) {
      return NextResponse.json({ subscription: null })
    }

    const provider = getPaymentProvider()
    const subscription = await provider.getSubscription(subscriptionId)

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status.toLowerCase(),
        current_period_end: subscription.currentPeriodEnd
          ? Math.floor(subscription.currentPeriodEnd.getTime() / 1000)
          : null,
        cancel_at_period_end: subscription.cancelAtPeriodEnd,
        trial_end: null,
        items: [
          {
            price_id: subscription.interval === 'month' ? 'pro_monthly' : 'pro_yearly',
            interval: subscription.interval,
          },
        ],
      },
    })
  } catch (error: unknown) {
    console.error('Get subscription error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao buscar assinatura.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST - Atualiza assinatura (change_interval ou downgrade)
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

    const supabase = await createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const subIdCol = getSubscriptionIdColumn()
    const customerIdCol = getCustomerIdColumn()

    const { data: profile } = await supabase
      .from('profiles')
      .select(`${subIdCol}, subscription_status`)
      .eq('id', user.id)
      .single()

    const subscriptionId = (profile as Record<string, string>)?.[subIdCol]

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    const provider = getPaymentProvider()

    if (action === 'downgrade') {
      await provider.cancelSubscription(subscriptionId, false)
      return NextResponse.json({
        success: true,
        message: 'Assinatura será cancelada no final do período.',
      })
    }

    if (action === 'change_interval' && interval) {
      const { data: plan } = await supabase
        .from('plans')
        .select('price_monthly, price_yearly')
        .eq('id', 'pro')
        .single()

      if (!plan) {
        return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 })
      }

      const raw = interval === 'month' ? plan.price_monthly : plan.price_yearly
      const newValue = parsePlanMoney(raw)
      if (newValue == null || newValue <= 0) {
        return NextResponse.json({ error: 'Preço do plano inválido.' }, { status: 500 })
      }

      await provider.cancelSubscription(subscriptionId, true)

      const { data: profileData } = await supabase
        .from('profiles')
        .select(customerIdCol)
        .eq('id', user.id)
        .single()

      const customerId = (profileData as Record<string, string>)?.[customerIdCol]

      if (!customerId) {
        return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
      }

      const baseUrl =
        (() => {
          try {
            return new URL(request.url).origin
          } catch {
            return process.env.NEXT_PUBLIC_APP_URL || 'https://meu-salario-lime.vercel.app'
          }
        })()

      const { paymentLink } = await provider.createSubscription({
        customerId,
        planId: 'pro',
        value: newValue,
        interval,
        userId: user.id,
        baseUrl,
      })

      await supabase
        .from('profiles')
        .update({ [subIdCol]: null })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Intervalo alterado. Complete o pagamento para ativar.',
        paymentLink,
      })
    }

    return NextResponse.json({ error: 'Ação não implementada.' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Manage subscription error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao gerenciar assinatura.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
