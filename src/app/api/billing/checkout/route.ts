import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getAsaasProvider } from '@/lib/payments/asaas-provider'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST - Cria assinatura no Asaas e retorna link de pagamento
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

    // Busca ou cria cliente no Asaas
    const { data: profile } = await supabase
      .from('profiles')
      .select('asaas_customer_id')
      .eq('id', user.id)
      .single()

    const asaas = getAsaasProvider()
    let customerId = profile?.asaas_customer_id ?? null

    if (!customerId) {
      const { customerId: newCustomerId } = await asaas.createCustomer({
        id: user.id,
        name: user.user_metadata?.name || user.email || 'Usuário',
        email: user.email || '',
      })
      customerId = newCustomerId
      
      // Salva customer ID no banco
      await supabase
        .from('profiles')
        .update({ asaas_customer_id: customerId })
        .eq('id', user.id)
    }

    // Cria assinatura no Asaas
    const { subscriptionId, paymentLink } = await asaas.createSubscription({
      customerId,
      planId: 'pro',
      value: Number(planValue),
      interval: safeInterval,
    })

    // Salva subscription ID no banco
    await supabase
      .from('profiles')
      .update({ 
        asaas_subscription_id: subscriptionId,
        subscription_status: 'pending',
      })
      .eq('id', user.id)

    return NextResponse.json({ url: paymentLink })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Erro ao processar checkout. Verifique se o Asaas está configurado.' 
    }, { status: 500 })
  }
}

