import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import {
  getDefaultFreeSimulationsLimit,
  getDefaultFreeComparisonsLimit,
  getDefaultFreeCompatibilityLimit,
} from '@/lib/usage-config'

export default function HowItWorksPage() {
  const freeSim = getDefaultFreeSimulationsLimit()
  const freeComp = getDefaultFreeComparisonsLimit()
  const freeCompat = getDefaultFreeCompatibilityLimit()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 lg:px-8">
        <div className="py-16 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white lg:text-5xl">Como funciona</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              O MeuSalario foi feito para dar previsibilidade: você preenche os campos do seu mês e recebe uma
              estimativa detalhada.
            </p>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              No plano <strong className="text-slate-200">Free</strong>, todas as telas estão disponíveis, com
              limites separados: até <strong className="text-slate-200">{freeSim}</strong> simulações salvas no
              histórico, <strong className="text-slate-200">{freeComp}</strong> comparações CLT × PJ salvas e{' '}
              <strong className="text-slate-200">{freeCompat}</strong> análises de compatibilidade ao ver o
              resultado. No <strong className="text-slate-200">Pro</strong>, esse uso é ilimitado e o dashboard
              fica completo.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-bold text-white">
                  1
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-bold text-white">Simulação mensal CLT/PJ</h2>
                  <p className="text-slate-400">
                    Você preenche: salário base, jornada, horas extras (50%, 100%, 150%), atrasos e adicionais (percentuais customizáveis).
                    O sistema calcula bruto, descontos estimados e líquido.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-bold text-white">
                  2
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-bold text-white">Dashboard e gráficos</h2>
                  <p className="text-slate-400">
                    No Free você acompanha uma visão básica; no Pro, o dashboard ganha indicadores completos,
                    evolução mensal e gráficos da tendência do salário.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-bold text-white">
                  3
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-bold text-white">Compatibilidade salarial</h2>
                  <p className="text-slate-400">
                    Cruze proposta (CLT ou PJ), benefícios e seu custo de vida para ver se sobra dinheiro no fim
                    do mês. No Free, abrir o resultado completo consome uma unidade do saldo de compatibilidade; no
                    Pro é ilimitado.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-bold text-white">
                  4
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-bold text-white">Comparador CLT x PJ</h2>
                  <p className="text-slate-400">
                    Mesma entrada base, regras distintas: líquido estimado lado a lado, com impostos e
                    percentuais ajustáveis. No Free, cada &quot;Comparar e salvar&quot; usa uma unidade do seu
                    saldo; no Pro é ilimitado.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-bold text-white">
                  5
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-bold text-white">Rescisão, 13º e férias</h2>
                  <p className="text-slate-400">
                    Rescisão com aviso, férias, 13º e FGTS; 13º e férias como simuladores dedicados. Tudo entra no
                    mesmo tipo de cota de simulações salvas no histórico no Free; no Pro, ilimitado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-6 text-center">
            <p className="text-slate-300">
              <strong className="text-white">💡 Nota importante:</strong> Os cálculos são estimativas configuráveis. Sempre valide com seu RH/contador para valores oficiais.
            </p>
          </div>

          <div className="text-center">
            <Link 
              href="/cadastro" 
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
            >
              Criar conta grátis →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
