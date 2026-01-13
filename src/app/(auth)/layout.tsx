import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* Logo no topo */}
      <div className="fixed left-8 top-8">
        <Link href="/" className="text-2xl font-bold transition-opacity hover:opacity-80">
          <span className="text-emerald-500">Meu</span>
          <span className="text-white">Salario</span>
        </Link>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          {children}
        </div>

        {/* Link voltar embaixo */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
          >
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
