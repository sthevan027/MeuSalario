import Link from 'next/link'

export default function SetupPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const nextPath = searchParams?.next ?? '/app/dashboard'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
        <Link href="/" className="text-sm text-sky-300 hover:text-sky-200">
          ← Voltar para a Home
        </Link>

        <h1 className="text-3xl font-semibold">Configuração necessária</h1>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <p className="text-slate-300">
            Para acessar o <span className="font-medium text-slate-100">sistema</span> (rotas <code>/app</code> e{' '}
            <code>/admin</code>), você precisa configurar as variáveis do Supabase em <code>.env.local</code>.
          </p>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 space-y-2">
            <div>1) Copie <code>env.example</code> → <code>.env.local</code></div>
            <div>
              2) Preencha:
              <ul className="list-disc pl-6 mt-1 text-slate-300">
                <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li><code>SUPABASE_SERVICE_ROLE_KEY</code> (para webhook/admin)</li>
              </ul>
            </div>
            <div>3) Reinicie o dev server: <code>pnpm dev</code></div>
          </div>

          <p className="text-sm text-slate-400">
            Depois disso, tente novamente:
          </p>

          <Link
            href={nextPath}
            className="inline-flex items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-50 hover:bg-sky-500/30"
          >
            Ir para {nextPath}
          </Link>
        </div>
      </main>
    </div>
  )
}

