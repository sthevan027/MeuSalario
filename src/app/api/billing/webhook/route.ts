import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getAsaasProvider } from '@/lib/payments/asaas-provider'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mapeia status do Asaas para formato do banco
 */
function mapAsaasStatus(status: string): 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'PENDING':
      return 'trialing' // Tratamos pending como trialing
    case 'OVERDUE':
      return 'past_due'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'none'
  }
}

/**
 * Determina plano baseado no status
 */
function planFromStatus(mapped: string): 'free' | 'pro' {
  return mapped === 'active' || mapped === 'trialing' ? 'pro' : 'free'
}

/**
 * POST - Processa webhooks do Asaas
 * 
 * Eventos suportados:
 * - PAYMENT_CONFIRMED: Pagamento confirmado
 * - PAYMENT_RECEIVED: Pagamento recebido
 * - PAYMENT_OVERDUE: Pagamento em atraso
 * - SUBSCRIPTION_CANCELED: Assinatura cancelada
 */
export async function POST(request: Request) {
  try {
    const asaas = getAsaasProvider()
    const headersList = headers()
    const body = await request.json()

    const admin = createSupabaseAdminClient()
    
    if (!admin) {
      return NextResponse.json({ error: 'Supabase Admin não configurado.' }, { status: 500 })
    }

    // Processa webhook através do provider
    const result = await asaas.handleWebhook(body, headersList)

    if (!result) {
      // Se não temos userId direto, tenta buscar via customerId do payload
      const payment = body.payment as any
      const subscription = body.subscription as any
      const customerId = payment?.customer || subscription?.customer

      if (customerId) {
        // Busca userId no banco via asaas_customer_id
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .eq('asaas_customer_id', customerId)
          .single()

        if (profile) {
          // Processa evento manualmente
          const event = body.event
          let status: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'CANCELED' = 'PENDING'

          if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
            status = 'ACTIVE'
          } else if (event === 'PAYMENT_OVERDUE') {
            status = 'OVERDUE'
          } else if (event === 'SUBSCRIPTION_CANCELED') {
            status = 'CANCELED'
          }

          const mappedStatus = mapAsaasStatus(status)
          const plan = planFromStatus(mappedStatus)

          const updateData: any = {
            subscription_status: mappedStatus,
            plan,
          }

          if (subscription?.id) {
            updateData.asaas_subscription_id = subscription.id
          }

          await admin
            .from('profiles')
            .update(updateData)
            .eq('id', profile.id)

          return NextResponse.json({ received: true, processed: true, method: 'fallback' })
        }
      }

      // Evento não processado, mas retorna sucesso para evitar retries
      return NextResponse.json({ received: true, message: 'Evento não processado' })
    }

    // Mapeia status para formato do banco
    const mappedStatus = mapAsaasStatus(result.status)
    const plan = planFromStatus(mappedStatus)

    // Atualiza perfil do usuário
    const updateData: any = {
      subscription_status: mappedStatus,
      plan,
    }

    // Se temos subscription ID, atualiza também
    if (result.subscriptionId) {
      updateData.asaas_subscription_id = result.subscriptionId
    }

    await admin
      .from('profiles')
      .update(updateData)
      .eq('id', result.userId)

    return NextResponse.json({ received: true, processed: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    
    // Retorna erro apenas se for de validação (token inválido)
    // Para outros erros, retorna sucesso para evitar retries infinitos
    if (error.message?.includes('Token') || error.message?.includes('token')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Loga erro mas retorna sucesso para evitar retries
    return NextResponse.json({ 
      received: true, 
      error: error.message,
      note: 'Erro processado, mas webhook aceito para evitar retries' 
    })
  }
}

