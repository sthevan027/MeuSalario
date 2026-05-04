import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured, requireEnv } from '@/lib/env'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const AUTH_RATE_LIMIT    = { limit: 10, windowSeconds: 60 }   // 10 tentativas/min por IP
const BILLING_RATE_LIMIT = { limit: 20, windowSeconds: 60 }   // 20 req/min por IP

const AUTH_PATHS    = ['/login', '/cadastro', '/recuperar-senha', '/atualizar-senha']
const BILLING_PATHS = ['/api/billing/']
// Webhook tem autenticação própria (token) e pode receber bursts legítimos do Asaas
const BILLING_EXEMPT_PATHS = ['/api/billing/webhook']

function applyRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  const ip = getClientIp(request)

  const isAuthPath    = AUTH_PATHS.some(p => pathname.startsWith(p))
  const isBillingPath = BILLING_PATHS.some(p => pathname.startsWith(p)) &&
                        !BILLING_EXEMPT_PATHS.some(p => pathname.startsWith(p))

  if (!isAuthPath && !isBillingPath) return null

  const options = isAuthPath ? AUTH_RATE_LIMIT : BILLING_RATE_LIMIT
  const key = `${isAuthPath ? 'auth' : 'billing'}:${ip}`
  const result = checkRateLimit(key, options)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(options.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    )
  }

  return null
}

export async function middleware(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const pathname = request.nextUrl.pathname
  const isAppRoute = pathname.startsWith('/app')
  const isAdminRoute = pathname.startsWith('/admin')
  const isRootRoute = pathname === '/'
  
  // Rotas públicas não precisam de verificação - melhora performance
  // Exceção: na raiz (/) tentamos restaurar sessão e redirecionar para dashboard.
  if (!isAppRoute && !isAdminRoute && !isRootRoute) {
    return NextResponse.next()
  }

  // Na home (/), se usuário já tiver sessão válida/renovável, entra direto no app.
  // Isso evita percepção de "perda de login" ao reabrir o site.
  if (isRootRoute) {
    if (!isSupabaseConfigured()) {
      return NextResponse.next()
    }

    const response = NextResponse.next({ request: { headers: request.headers } })
    const supabase = createServerClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = '/app/dashboard'
        url.search = ''

        const redirectResponse = NextResponse.redirect(url)
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        })

        return redirectResponse
      }
    } catch {
      // Home segue pública quando não houver sessão válida.
    }

    return response
  }

  // /app: auth é feita no layout (requireUser) para evitar loop de redirect no Edge
  if (isAppRoute) {
    if (pathname === '/app' || pathname === '/app/') {
      const url = request.nextUrl.clone()
      url.pathname = '/app/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // /admin: verificação de sessão no middleware
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Se o Supabase não estiver configurado, redireciona para setup
  if (!isSupabaseConfigured()) {
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error: unknown) {
    const err = error as { code?: string; status?: number }
    if (err.code !== 'refresh_token_not_found' && err.status !== 400) {
      throw error
    }
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  if (isAdminRoute) {
    // Admin é determinado apenas por profiles.role = 'admin'.
    let role: string | null = null
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      role = (data as { role?: string } | null)?.role ?? null
    } catch {
      role = null
    }

    if (role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/app/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
