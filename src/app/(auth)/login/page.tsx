import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function LoginPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const rawNext = searchParams?.next ?? '/app/dashboard'
  const nextPath = rawNext === '/' ? '/app/dashboard' : rawNext

  // Se já estiver autenticado, não mostra login: manda direto pro app.
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) redirect(nextPath)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Bem-vindo de volta</h1>
        <p className="mt-2 text-slate-400">Entre com sua conta para continuar</p>
      </div>

      {/* Form */}
      <LoginForm nextPath={nextPath} />

      {/* Footer Links */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-900 px-4 text-slate-500">ou</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-center text-sm">
          <Link 
            href="/recuperar-senha" 
            className="text-slate-400 transition-colors hover:text-emerald-400"
          >
            Esqueci minha senha
          </Link>
          <div className="text-slate-500">
            Não tem uma conta?{' '}
            <Link 
              href="/cadastro" 
              className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
