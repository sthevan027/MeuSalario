import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getAsaasProvider } from '@/lib/payments/asaas-provider'

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
      .select('asaas_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.asaas_subscription_id) {
      return NextResponse.json({ subscription: null })
    }

    const asaas = getAsaasProvider()
    const subscription = await asaas.getSubscription(profile.asaas_subscription_id)

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    // Converte para formato compatível com o frontend
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status.toLowerCase(), // ACTIVE -> active
        current_period_end: subscription.currentPeriodEnd 
          ? Math.floor(subscription.currentPeriodEnd.getTime() / 1000) 
          : null,
        cancel_at_period_end: subscription.cancelAtPeriodEnd,
        trial_end: null, // Asaas não tem trial nativo, pode ser implementado depois
        items: [
          {
            price_id: subscription.interval === 'month' ? 'pro_monthly' : 'pro_yearly',
            interval: subscription.interval,
          },
        ],
      },
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao buscar assinatura.' }, { status: 500 })
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

    const supabase = createSupabaseActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('asaas_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.asaas_subscription_id) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    const asaas = getAsaasProvider()

    if (action === 'downgrade') {
      // Cancela a assinatura no final do período
      await asaas.cancelSubscription(profile.asaas_subscription_id, false)

      return NextResponse.json({ 
        success: true, 
        message: 'Assinatura será cancelada no final do período.' 
      })
    }

    if (action === 'change_interval' && interval) {
      // No Asaas, para mudar o intervalo, precisamos cancelar a atual e criar uma nova
      // Ou podemos atualizar a assinatura diretamente (depende da API do Asaas)
      // Por enquanto, vamos cancelar e criar nova (o usuário precisará fazer checkout novamente)
      
      // Busca plano para obter novo preço
      const { data: plan } = await supabase
        .from('plans')
        .select('price_monthly, price_yearly')
        .eq('id', 'pro')
        .single()

      if (!plan) {
        return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 })
      }

      const newValue = interval === 'month' ? plan.price_monthly : plan.price_yearly

      // Cancela assinatura atual
      await asaas.cancelSubscription(profile.asaas_subscription_id, true)

      // Cria nova assinatura com novo intervalo
      const { data: profileData } = await supabase
        .from('profiles')
        .select('asaas_customer_id')
        .eq('id', user.id)
        .single()

      if (!profileData?.asaas_customer_id) {
        return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
      }

      const { subscriptionId, paymentLink } = await asaas.createSubscription({
        customerId: profileData.asaas_customer_id,
        planId: 'pro',
        value: Number(newValue),
        interval,
      })

      // Atualiza subscription ID no banco
      await supabase
        .from('profiles')
        .update({ asaas_subscription_id: subscriptionId })
        .eq('id', user.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Intervalo alterado. Complete o pagamento para ativar.',
        paymentLink,
      })
    }

    return NextResponse.json({ error: 'Ação não implementada.' }, { status: 400 })
  } catch (error: any) {
    console.error('Manage subscription error:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao gerenciar assinatura.' }, { status: 500 })
  }
}
