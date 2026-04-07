import { NextResponse } from 'next/server'
import { safeRedirectPath } from '@/lib/auth/safe-redirect-path'
import { createSupabaseActionClient } from '@/lib/supabase/server'

/**
 * Limpa cookies de sessão inválidos e redireciona para login.
 * Usado quando requireUser detecta sessão inválida (ex: refresh_token_not_found)
 * para evitar loop de redirect entre /login e /app/dashboard.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const safeNext = safeRedirectPath(requestUrl.searchParams.get('redirect'), '/login')

  const supabase = await createSupabaseActionClient()
  await supabase.auth.signOut({ scope: 'local' })

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
}
