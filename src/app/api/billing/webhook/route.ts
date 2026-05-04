import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { getPaymentProvider, getSubscriptionIdColumn } from '@/lib/payments'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { captureException, captureMessage } from '@/lib/sentry'
import { mapWebhookStatus, planFromWebhookStatus } from '@/lib/payments/webhook-helpers'
import { logAuditEvent } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function correlationId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex')
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
    const payloadHash = sha256(body)

    const admin = createSupabaseAdminClient()

    if (!admin) {
      log('webhook.error', { reason: 'supabase_admin_not_configured' })
      captureMessage('Webhook: Supabase Admin não configurado', 'error', {
        tags: { cid, area: 'billing_webhook' },
      })
      return NextResponse.json({ error: 'Supabase Admin não configurado.' }, { status: 500 })
    }

    // handleWebhook lança se o token for inválido/ausente — resulta em 401 abaixo
    const result = await provider.handleWebhook(body, headersList)

    if (!result) {
      log('webhook.skipped', { reason: 'event_not_handled' })
      return NextResponse.json({ received: true, message: 'Evento não processado' })
    }

    log('webhook.parsed', { status: result.status, subscriptionId: result.subscriptionId })

    // ─── Idempotência ──────────────────────────────────────────────────────────
    // Usa o subscriptionId + status como event_id único por evento de negócio.
    // O ON CONFLICT ignora duplicatas silenciosamente.
    const eventId = `${result.subscriptionId ?? 'no-sub'}:${result.status}:${result.userId}`
    const { error: idempotencyError, data: idempotencyData } = await admin
      .from('webhook_events')
      .insert({
        provider: 'asaas',
        event_id: eventId,
        event_type: result.status,
        payload_hash: payloadHash,
      })
      .select('id')
      .single()

    if (idempotencyError) {
      // Código 23505 = unique_violation (PostgreSQL) — evento já processado
      if ((idempotencyError as { code?: string }).code === '23505') {
        log('webhook.duplicate', { eventId })
        return NextResponse.json({ received: true, message: 'Evento duplicado, ignorado.' })
      }
      // Outro erro de DB — logar mas continuar processando
      log('webhook.idempotency_error', { error: idempotencyError.message })
    }

    const webhookEventRowId = idempotencyData?.id
    // ──────────────────────────────────────────────────────────────────────────

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
        // Marcar evento como skipped na tabela de idempotência
        if (webhookEventRowId) {
          await admin.from('webhook_events').update({ status: 'skipped' }).eq('id', webhookEventRowId)
        }
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
      if (webhookEventRowId) {
        await admin.from('webhook_events').update({ status: 'error', error_message: updateError.message, user_id: userId }).eq('id', webhookEventRowId)
      }
      // Retorna 500 para que o Asaas reenvie o evento — falha crítica de persistência
      return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 })
    }

    // Atualizar evento com userId resolvido
    if (webhookEventRowId) {
      await admin.from('webhook_events').update({ user_id: userId }).eq('id', webhookEventRowId)
    }

    void logAuditEvent({
      userId,
      action: `subscription.${mappedStatus.toLowerCase()}`,
      resource: 'subscription',
      resourceId: result.subscriptionId ?? undefined,
      metadata: { mappedStatus, plan, cid },
    })

    log('webhook.processed', { userId, mappedStatus, plan })
    return NextResponse.json({ received: true, processed: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    log('webhook.exception', { error: message })

    // Token inválido ou ausente → 401 (não fazer retry do Asaas)
    if (message.includes('signature') || message.toLowerCase().includes('webhook') || message.includes('ASAAS_WEBHOOK_TOKEN')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    captureException(error, {
      tags: { cid, area: 'billing_webhook' },
    })

    // Erro inesperado → 500 para Asaas reenviar
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
