import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { safeRedirectPath } from '@/lib/auth/safe-redirect-path'
import { requireEnv } from '@/lib/env'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type') // ex: "signup" | "recovery"
  const next = requestUrl.searchParams.get('next') // destino após OAuth (Google, etc)

  const redirectTo =
    type === 'recovery' ? '/atualizar-senha' : safeRedirectPath(next)
  const redirectUrl = new URL(redirectTo, requestUrl.origin)

  if (code) {
    const cookieStore = await cookies()
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

    const supabase = createServerClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookiesToSet.push({ name, value, options })
          },
          remove(name: string, options: Record<string, unknown>) {
            cookiesToSet.push({ name, value: '', options: { ...options, maxAge: 0 } })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'auth_callback_error')
      return NextResponse.redirect(loginUrl)
    }

    const response = NextResponse.redirect(redirectUrl)
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options as any)
    }
    return response
  }

  return NextResponse.redirect(redirectUrl)
}

