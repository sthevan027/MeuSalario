import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'

/**
 * Limpa cookies de sessão inválidos e redireciona para login.
 * Usado quando requireUser detecta sessão inválida (ex: refresh_token_not_found)
 * para evitar loop de redirect entre /login e /app/dashboard.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const redirectTo = requestUrl.searchParams.get('redirect') ?? '/login'

  const supabase = createSupabaseActionClient()
  await supabase.auth.signOut({ scope: 'local' })

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}
