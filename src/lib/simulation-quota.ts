import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type PlanTypeApi = 'free' | 'premium'

export type QuotaKind = 'simulation' | 'comparison' | 'compatibility'

export type ConsumeQuotaSuccess = {
  remaining: number | null
  unlimited: boolean
}

export type ConsumeQuotaFailure = {
  code: string
  message: string
}

function parseRpcPayload(data: unknown): Record<string, unknown> | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>
  return null
}

function parseConsumeResult(
  data: unknown,
  quotaExceededMessage: string
): ({ ok: true } & ConsumeQuotaSuccess) | ({ ok: false } & ConsumeQuotaFailure) {
  const o = parseRpcPayload(data)
  if (!o) {
    return { ok: false, code: 'INVALID_RESPONSE', message: 'Resposta inválida do servidor.' }
  }

  if (o.ok === true) {
    return {
      ok: true,
      remaining: o.remaining === null || o.remaining === undefined ? null : Number(o.remaining),
      unlimited: o.unlimited === true,
    }
  }

  const code = String(o.code ?? 'UNKNOWN')
  if (code === 'QUOTA_EXCEEDED') {
    return { ok: false, code, message: quotaExceededMessage }
  }

  return { ok: false, code, message: 'Não foi possível concluir a operação.' }
}

/** Consome 1 unidade de simulação salva no histórico (mensal, 13º, férias, rescisão). */
export async function consumeSimulationQuota(
  supabase: SupabaseClient
): Promise<{ ok: true } & ConsumeQuotaSuccess | { ok: false } & ConsumeQuotaFailure> {
  const { data, error } = await supabase.rpc('try_consume_simulation')

  if (error) {
    return {
      ok: false,
      code: 'RPC_ERROR',
      message: error.message || 'Não foi possível verificar o limite de simulações.',
    }
  }

  return parseConsumeResult(
    data,
    'Você atingiu o limite de simulações salvas no plano FREE. Faça upgrade ou compre mais créditos.'
  )
}

/** Consome 1 comparação CLT × PJ salva no histórico. */
export async function consumeComparisonQuota(
  supabase: SupabaseClient
): Promise<{ ok: true } & ConsumeQuotaSuccess | { ok: false } & ConsumeQuotaFailure> {
  const { data, error } = await supabase.rpc('try_consume_comparison')

  if (error) {
    return {
      ok: false,
      code: 'RPC_ERROR',
      message: error.message || 'Não foi possível verificar o limite de comparações.',
    }
  }

  return parseConsumeResult(
    data,
    'Você atingiu o limite de comparações CLT × PJ no plano FREE. Faça upgrade para continuar.'
  )
}

/** Consome 1 análise de compatibilidade salarial (ver resultado). */
export async function consumeCompatibilityQuota(
  supabase: SupabaseClient
): Promise<{ ok: true } & ConsumeQuotaSuccess | { ok: false } & ConsumeQuotaFailure> {
  const { data, error } = await supabase.rpc('try_consume_compatibility')

  if (error) {
    return {
      ok: false,
      code: 'RPC_ERROR',
      message: error.message || 'Não foi possível verificar o limite de compatibilidade.',
    }
  }

  return parseConsumeResult(
    data,
    'Você atingiu o limite de análises de compatibilidade no plano FREE. Faça upgrade para continuar.'
  )
}

export async function refundQuota(userId: string, kind: QuotaKind): Promise<void> {
  const admin = createSupabaseAdminClient()
  if (!admin) {
    console.error('[quota] refund skipped: service role não configurada')
    return
  }
  const { error } = await admin.rpc('refund_quota', { p_user_id: userId, p_kind: kind })
  if (error) {
    console.error('[quota] refund failed', kind, error)
  }
}

export function planToApiType(plan: 'free' | 'pro'): PlanTypeApi {
  return plan === 'pro' ? 'premium' : 'free'
}

export type FreeUsageSnapshot = {
  plan: 'free' | 'pro'
  simulations_remaining: number
  comparisons_remaining: number
  compatibility_checks_remaining: number
  quota_reset_at?: string | null
}

export function buildUsageResponse(profile: FreeUsageSnapshot): {
  simulations_remaining: number | null
  comparisons_remaining: number | null
  compatibility_checks_remaining: number | null
  quota_reset_at: string | null
  plan_type: PlanTypeApi
  unlimited: boolean
} {
  const unlimited = profile.plan === 'pro'
  return {
    simulations_remaining: unlimited ? null : profile.simulations_remaining,
    comparisons_remaining: unlimited ? null : profile.comparisons_remaining,
    compatibility_checks_remaining: unlimited ? null : profile.compatibility_checks_remaining,
    quota_reset_at: profile.quota_reset_at ?? null,
    plan_type: planToApiType(profile.plan),
    unlimited,
  }
}

/** Retorna true se o reset mensal já venceu (ou nunca foi definido). */
export function isQuotaResetDue(resetAt: string | null | undefined): boolean {
  if (!resetAt) return true
  return Date.now() >= new Date(resetAt).getTime()
}

export type QuotaPersistMeta = {
  simulationsRemaining: number | null
  comparisonsRemaining: number | null
  compatibilityRemaining: number | null
  unlimited: boolean
}

/** Consome quota de simulação, executa insert; em falha, estorna. */
export async function persistWithSimulationQuota(
  supabase: SupabaseClient,
  userId: string,
  persist: () => Promise<{ error: { message: string } | null }>
): Promise<
  { ok: true; quota: Pick<QuotaPersistMeta, 'simulationsRemaining' | 'unlimited'> } | { ok: false; message: string; code?: string }
> {
  const q = await consumeSimulationQuota(supabase)
  if (!q.ok) return { ok: false, message: q.message, code: q.code }

  const { error } = await persist()
  if (error) {
    await refundQuota(userId, 'simulation')
    return { ok: false, message: error.message }
  }

  return {
    ok: true,
    quota: {
      simulationsRemaining: q.unlimited ? null : q.remaining,
      unlimited: q.unlimited,
    },
  }
}

/** Consome quota de comparação, executa insert; em falha, estorna. */
export async function persistWithComparisonQuota(
  supabase: SupabaseClient,
  userId: string,
  persist: () => Promise<{ error: { message: string } | null }>
): Promise<
  { ok: true; quota: Pick<QuotaPersistMeta, 'comparisonsRemaining' | 'unlimited'> } | { ok: false; message: string; code?: string }
> {
  const q = await consumeComparisonQuota(supabase)
  if (!q.ok) return { ok: false, message: q.message, code: q.code }

  const { error } = await persist()
  if (error) {
    await refundQuota(userId, 'comparison')
    return { ok: false, message: error.message }
  }

  return {
    ok: true,
    quota: {
      comparisonsRemaining: q.unlimited ? null : q.remaining,
      unlimited: q.unlimited,
    },
  }
}
