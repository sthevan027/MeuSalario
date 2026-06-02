import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export interface AuditEvent {
  userId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  metadata?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Grava um evento de auditoria de forma assíncrona (fire-and-forget).
 * Falhas são logadas mas não propagadas para não interromper o fluxo principal.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const admin = createSupabaseAdminClient()
    if (!admin) return

    await admin.from('audit_log').insert({
      user_id: event.userId ?? null,
      action: event.action,
      resource: event.resource,
      resource_id: event.resourceId ?? null,
      metadata: event.metadata ?? {},
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
    })
  } catch (err) {
    console.error('[audit] falha ao gravar evento:', err)
  }
}
