import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured, requireEnv } from '@/lib/env'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Rate limit de auth é por IP — não há userId disponível antes da autenticação.
// Rate limit de billing é aplicado dentro dos handlers (onde user.id já está disponível).
const AUTH_RATE_LIMIT = { limit: 10, windowSeconds: 60 }   // 10 tentativas/min por IP

const AUTH_PATHS = ['/login', '/cadastro', '/recuperar-senha', '/atualizar-senha']

function applyRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  const ip = getClientIp(request)

  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  if (!isAuthPath) return null

  const key = `auth:${ip}`
  const result = checkRateLimit(key, AUTH_RATE_LIMIT)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(AUTH_RATE_LIMIT.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    )
  }

  return null
}

function createSupabaseCookieClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
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
    const supabase = createSupabaseCookieClient(request, response)

    try {
      // getSession() decodifica o JWT do cookie localmente (sem chamada de rede),
      // suficiente para decidir o redirect de UX na home.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
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

  // /app: Chama getUser() para disparar refresh do JWT quando necessário e propagar
  // os cookies atualizados. Não redireciona em caso de sessão inválida — o layout
  // (requireUser) trata isso para evitar loop de redirect no Edge.
  if (isAppRoute) {
    if (pathname === '/app' || pathname === '/app/') {
      const url = request.nextUrl.clone()
      url.pathname = '/app/dashboard'
      return NextResponse.redirect(url)
    }

    if (!isSupabaseConfigured()) return NextResponse.next()

    const response = NextResponse.next({ request: { headers: request.headers } })
    const supabase = createSupabaseCookieClient(request, response)

    try {
      await supabase.auth.getUser()
    } catch {
      // Layout (requireUser) lida com sessão inválida — não redirecionar aqui.
    }

    return response
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

  // getSession() lê o JWT do cookie localmente (sem chamada de rede) para decidir
  // o redirect de UX ao login. A validação real de auth + role admin é feita pelo
  // layout em src/app/admin/layout.tsx via requireAdmin().
  let hasSession = false
  try {
    const { data } = await supabase.auth.getSession()
    hasSession = !!data.session
  } catch (error: unknown) {
    const err = error as { code?: string; status?: number }
    if (err.code === 'refresh_token_not_found' || err.status === 400) {
      hasSession = false
    } else {
      throw error
    }
  }

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
