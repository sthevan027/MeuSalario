import Link from 'next/link'
import { Header } from '@/components/layout/Header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        {/* Code */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-rose-400">
          Erro 404
        </div>

        <h1 className="text-6xl font-black tabular-nums text-white sm:text-8xl">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-slate-200 sm:text-2xl">
          Página não encontrada
        </h2>

        <p className="mt-3 max-w-md text-base leading-relaxed text-slate-400">
          A página que você está procurando não existe ou foi movida. Verifique o endereço ou volte
          para o início.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-500/30"
          >
            ← Voltar ao início
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10"
          >
            Ir para o app
          </Link>
        </div>

        {/* Decorative */}
        <div className="mt-16 text-8xl font-black text-white/[0.03] select-none sm:text-[10rem]">
          404
        </div>
      </main>
    </div>
  )
}
