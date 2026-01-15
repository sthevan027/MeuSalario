import Link from 'next/link'
import { Header } from '@/components/layout/Header'

export default function PlanosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-8">
        <div className="py-16 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white lg:text-5xl">Planos e preços</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comece grátis e faça upgrade quando precisar de recursos avançados
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">FREE</div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">R$ 0</span>
                <span className="text-slate-400">/mês</span>
              </div>

              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-slate-300">
                  <span className="text-emerald-400">✓</span>
                  <span>Simulação mensal básica</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <span className="text-emerald-400">✓</span>
                  <span>Visualização do salário atual</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem histórico</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem gráficos</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem comparador CLT x PJ</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem simulador de rescisão</span>
                </li>
              </ul>

              <Link 
                href="/cadastro" 
                className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
              >
                Criar conta
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm">
              <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-bold text-white">
                POPULAR
              </div>

              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-400">PRO</div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">R$ 5,50</span>
                <span className="text-slate-400">/mês</span>
              </div>
              <div className="mb-6 text-sm text-slate-400">ou R$ 55/ano (economize 17%)</div>

              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Tudo do plano Free</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Dashboard completo</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Gráficos</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Histórico mensal</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Rescisão</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Comparador CLT x PJ</span>
                </li>
              </ul>

              <Link 
                href="/cadastro" 
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
              >
                Assinar Pro
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-6 text-center">
            <p className="text-slate-300">
              <strong className="text-white">💡 Nota:</strong> Os cálculos são estimativas configuráveis. Sempre valide com seu RH/contador para valores oficiais.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
