import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type PlanTypeApi = 'free' | 'premium'

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

/** Consome 1 simulação no banco (plano FREE). Plano PRO não decrementa. */
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
    return {
      ok: false,
      code,
      message:
        'Você atingiu o limite de simulações do plano FREE. Faça upgrade ou compre mais simulações.',
    }
  }

  return {
    ok: false,
    code,
    message: 'Não foi possível realizar a simulação.',
  }
}

/**
 * Reverte 1 consumo se o insert falhar (somente FREE).
 * Só pode ser executado no servidor com SUPABASE_SERVICE_ROLE_KEY — não exponha ao client.
 */
export async function refundSimulationQuota(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient()
  if (!admin) {
    console.error('[simulation-quota] refund skipped: service role não configurada')
    return
  }
  const { error } = await admin.rpc('refund_simulation_quota', { p_user_id: userId })
  if (error) {
    console.error('[simulation-quota] refund failed', error)
  }
}

export function planToApiType(plan: 'free' | 'pro'): PlanTypeApi {
  return plan === 'pro' ? 'premium' : 'free'
}

export function buildUsageResponse(profile: {
  plan: 'free' | 'pro'
  simulations_remaining: number
}): {
  simulations_remaining: number | null
  plan_type: PlanTypeApi
  unlimited: boolean
} {
  const unlimited = profile.plan === 'pro'
  return {
    simulations_remaining: unlimited ? null : profile.simulations_remaining,
    plan_type: planToApiType(profile.plan),
    unlimited,
  }
}

export type QuotaPersistMeta = {
  simulationsRemaining: number | null
  unlimited: boolean
}

/** Consome quota, executa insert; em falha do insert, estorna o consumo (FREE). */
export async function persistWithSimulationQuota(
  supabase: SupabaseClient,
  userId: string,
  persist: () => Promise<{ error: { message: string } | null }>
): Promise<
  { ok: true; quota: QuotaPersistMeta } | { ok: false; message: string; code?: string }
> {
  const q = await consumeSimulationQuota(supabase)
  if (!q.ok) return { ok: false, message: q.message, code: q.code }

  const { error } = await persist()
  if (error) {
    await refundSimulationQuota(userId)
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
