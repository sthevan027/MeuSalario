import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  plan: 'free' | 'pro'
  role: 'user' | 'admin'
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  email: string | null
  name: string | null
  /** Saldo de simulações salvas no histórico (FREE). */
  simulations_remaining: number
  /** Saldo de comparações CLT × PJ salvas (FREE). */
  comparisons_remaining: number
  /** Saldo de análises de compatibilidade salarial (FREE). */
  compatibility_checks_remaining: number
}

/** Busca perfil - cache() deduplica chamadas na mesma request (layout + page). */
export const getProfileOrNull = cache(async (): Promise<Profile | null> => {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const selectProfile = () =>
    supabase
      .from('profiles')
      .select(
        'id, plan, role, subscription_status, email, name, simulations_remaining, comparisons_remaining, compatibility_checks_remaining'
      )
      .eq('id', user.id)
      .single()

  let { data, error } = await selectProfile()

  // Sessão válida mas sem linha em profiles → cria via RPC (evita clear-session + signOut em loop)
  if (!data && error?.code === 'PGRST116') {
    const { error: rpcError } = await supabase.rpc('ensure_my_profile')
    if (rpcError) {
      console.error('[profile] ensure_my_profile:', rpcError.message)
    }
    ;({ data, error } = await selectProfile())
  }

  if (!data) return null

  const row = data as Profile & {
    simulations_remaining?: number | null
    comparisons_remaining?: number | null
    compatibility_checks_remaining?: number | null
  }
  return {
    ...row,
    simulations_remaining:
      typeof row.simulations_remaining === 'number' ? row.simulations_remaining : 3,
    comparisons_remaining:
      typeof row.comparisons_remaining === 'number' ? row.comparisons_remaining : 2,
    compatibility_checks_remaining:
      typeof row.compatibility_checks_remaining === 'number'
        ? row.compatibility_checks_remaining
        : 2,
  }
})

export async function requireUser() {
  const profile = await getProfileOrNull()
  // Redireciona via clear-session para limpar cookies inválidos (ex: refresh_token_not_found)
  // e evitar loop de redirect /login <-> /app/dashboard que causa piscar tela preta
  if (!profile) redirect('/auth/clear-session?redirect=/login')
  return profile
}

export async function requirePro() {
  const profile = await requireUser()
  if (profile.plan !== 'pro') redirect('/app/conta?paywall=pro')
  return profile
}

export async function requireAdmin() {
  const profile = await requireUser()
  if (profile.role !== 'admin') redirect('/app/dashboard')
  return profile
}

export type UserIdentity = {
  provider: string
  id: string
}

/**
 * Retorna as identidades (providers OAuth) vinculadas ao usuário
 */
export async function getUserIdentities(): Promise<UserIdentity[]> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.identities) return []

  return user.identities.map((identity) => ({
    provider: identity.provider,
    id: identity.id,
  }))
}

/**
 * Verifica se o usuário tem Google vinculado
 */
export async function isGoogleLinked(): Promise<boolean> {
  const identities = await getUserIdentities()
  return identities.some((i) => i.provider === 'google')
}

