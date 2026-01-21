import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { getAsaasProvider } from '@/lib/payments/asaas-provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST - Cancela assinatura (com opção de retenção)
 * Nota: Ofertas de desconto não são suportadas nativamente pelo Asaas via API
 * mas podem ser implementadas manualmente ou via webhook
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
      .select('asaas_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.asaas_subscription_id) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    // Se há oferta de desconto, retorna sucesso sem cancelar
    // (No Asaas, descontos precisam ser aplicados manualmente ou via webhook)
    if (offer_discount && offer_discount > 0 && offer_discount <= 100) {
      // Por enquanto, apenas retorna sucesso
      // Em produção, você pode criar uma nota/observação no Asaas ou aplicar desconto manualmente
      return NextResponse.json({
        success: true,
        message: `Oferta de ${offer_discount}% de desconto registrada. Entre em contato com o suporte para aplicar.`,
        applied_discount: offer_discount,
      })
    }

    // Cancela assinatura
    const asaas = getAsaasProvider()
    
    if (cancel_immediately) {
      await asaas.cancelSubscription(profile.asaas_subscription_id, true)
      
      // Atualiza status no banco
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'canceled',
          plan: 'free',
        })
        .eq('id', user.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Assinatura cancelada imediatamente.' 
      })
    } else {
      await asaas.cancelSubscription(profile.asaas_subscription_id, false)
      
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
