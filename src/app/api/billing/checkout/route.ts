import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getPaymentProvider, getCustomerIdColumn } from '@/lib/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST - Cria sessão de checkout e retorna URL de pagamento (Asaas)
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

    const { paymentLink } = await provider.createSubscription({
      customerId: customerId || user.id,
      planId: 'pro',
      value: Number(planValue),
      interval: safeInterval,
      userId: user.id,
      baseUrl,
    })

    await supabase
      .from('profiles')
      .update({ subscription_status: 'trialing' })
      .eq('id', user.id)

    return NextResponse.json({ url: paymentLink })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao processar checkout.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
