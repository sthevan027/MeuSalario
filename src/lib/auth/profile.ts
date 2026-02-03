import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  plan: 'free' | 'pro'
  role: 'user' | 'admin'
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  email: string | null
  name: string | null
}

/** Busca perfil do usuário. Em React 19+, envolver com cache() para deduplicar na mesma request. */
export async function getProfileOrNull(): Promise<Profile | null> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, plan, role, subscription_status, email, name')
    .eq('id', user.id)
    .single()

  return (data as any) ?? null
}

export async function requireUser() {
  const profile = await getProfileOrNull()
  if (!profile) redirect('/login')
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

