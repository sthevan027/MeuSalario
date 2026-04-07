import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { requireEnv } from '@/lib/env'

export type CookieStore = Awaited<ReturnType<typeof cookies>>

/**
 * Client para Server Components (RSC):
 * - Pode LER cookies
 * - NÃO pode escrever/apagar cookies (Next 13.5 restringe isso a Route Handlers e Server Actions)
 * - Desliga auto-refresh/persist no servidor para evitar loops e spam de requests
 * - Trata erros de refresh_token graciosamente (evita spam de "refresh_token_not_found")
 * - Se cookieStore for passado, usa-o (obrigatório dentro de unstable_cache; cookies() deve ser chamado fora).
 */
export async function createSupabaseServerClient(cookieStore?: CookieStore) {
  const store = cookieStore ?? (await cookies())

  const client = createServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      get(name: string) {
        return store.get(name)?.value
      },
      // IMPORTANTE: no-op em Server Components (evita: "Cookies can only be modified...")
      set() {},
      remove() {},
    },
    auth: {
      // Server Components só precisam ler a sessão; refresh/persist é responsabilidade
      // de middleware/route handler/server action.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      // Evita tentar refresh quando token não existe
      flowType: 'pkce',
    },
  })

  // Wrapper para getUser() que trata erros de refresh_token silenciosamente
  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = async (jwt?: string) => {
    try {
      return await originalGetUser(jwt)
    } catch (error: any) {
      // Se for erro de refresh_token inválido/ausente, retorna sessão vazia (usuário não autenticado)
      // Isso evita spam de "refresh_token_not_found" no console quando cookies estão inválidos
      if (error?.code === 'refresh_token_not_found' || (error?.status === 400 && error?.message?.includes('refresh'))) {
        return { data: { user: null }, error: null } as any
      }
      throw error
    }
  }

  return client
}

/**
 * Client para Server Actions e Route Handlers:
 * - Pode ler + escrever cookies (necessário para login/logout/refresh)
 */
export async function createSupabaseActionClient() {
  const cookieStore = await cookies()

  return createServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })
}

