import { createClient } from '@supabase/supabase-js'
import { isServiceRoleConfigured, isSupabaseConfigured, requireEnv } from '@/lib/env'

export function createSupabaseAdminClient() {
  // Não quebrar a UI quando a env não estiver configurada.
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) return null

  return createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

