import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured, requireEnv } from '@/lib/env'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAppRoute = pathname.startsWith('/app')
  const isAdminRoute = pathname.startsWith('/admin')
  
  // Rotas públicas não precisam de verificação - melhora performance
  if (!isAppRoute && !isAdminRoute) {
    return NextResponse.next()
  }

  // /app: auth é feita no layout (requireUser) para evitar loop de redirect no Edge
  if (isAppRoute) {
    if (pathname === '/app' || pathname === '/app/') {
      const url = request.nextUrl.clone()
      url.pathname = '/app/simulacao'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // /admin: verificação de sessão no middleware
  let response = NextResponse.next({
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
      set(name: string, value: string, options: any) {
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
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
  } catch (error: any) {
    if (error?.code !== 'refresh_token_not_found' && error?.status !== 400) {
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
      role = (data as any)?.role ?? null
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

