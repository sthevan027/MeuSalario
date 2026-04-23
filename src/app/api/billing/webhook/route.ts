import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPaymentProvider, getSubscriptionIdColumn } from '@/lib/payments'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { captureException, captureMessage } from '@/lib/sentry'
import { mapWebhookStatus, planFromWebhookStatus } from '@/lib/payments/webhook-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function correlationId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * POST - Processa webhooks do Asaas
 */
export async function POST(request: Request) {
  const cid = correlationId()
  const log = (msg: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ cid, msg, ...data }))

  try {
    log('webhook.received')

    const provider = getPaymentProvider()
    const headersList = new Headers(await headers())
    const body = await request.text()

    const admin = createSupabaseAdminClient()

    if (!admin) {
      log('webhook.error', { reason: 'supabase_admin_not_configured' })
      captureMessage('Webhook: Supabase Admin não configurado', 'error', {
        tags: { cid, area: 'billing_webhook' },
      })
      return NextResponse.json({ error: 'Supabase Admin não configurado.' }, { status: 500 })
    }

    const result = await provider.handleWebhook(body, headersList)

    if (!result) {
      log('webhook.skipped', { reason: 'event_not_handled' })
      return NextResponse.json({ received: true, message: 'Evento não processado' })
    }

    log('webhook.parsed', { status: result.status, subscriptionId: result.subscriptionId })

    let userId = result.userId

    if (userId.startsWith('email:')) {
      const email = userId.replace(/^email:/, '')
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile?.id) {
        log('webhook.user_not_found', { email })
        captureMessage('Webhook: usuário não encontrado por email', 'warning', {
          tags: { cid, area: 'billing_webhook' },
          extra: { email },
        })
        return NextResponse.json({ received: true, message: 'Usuário não encontrado para email' })
      }
      userId = profile.id
    }

    const mappedStatus = mapWebhookStatus(result.status)
    const plan = planFromWebhookStatus(mappedStatus)

    const subIdCol = getSubscriptionIdColumn()

    const updateData: Record<string, unknown> = {
      subscription_status: mappedStatus,
      plan,
    }

    if (result.subscriptionId) {
      updateData[subIdCol] = result.subscriptionId
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      log('webhook.db_error', { userId, error: updateError.message })
      captureException(new Error(`Webhook DB update failed: ${updateError.message}`), {
        tags: { cid, area: 'billing_webhook' },
        extra: { userId, mappedStatus, plan },
      })
      return NextResponse.json({ received: true, error: 'Falha ao atualizar perfil' }, { status: 500 })
    }

    log('webhook.processed', { userId, mappedStatus, plan })
    return NextResponse.json({ received: true, processed: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    log('webhook.exception', { error: message })

    if (message.includes('signature') || message.includes('Webhook')) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    captureException(error, {
      tags: { cid, area: 'billing_webhook' },
    })

    // Retorna 200 para evitar retries do Asaas em erros não-críticos
    return NextResponse.json({
      received: true,
      error: message,
    })
  }
}
