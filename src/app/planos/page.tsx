import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  getDefaultFreeSimulationsLimit,
  getDefaultFreeComparisonsLimit,
  getDefaultFreeCompatibilityLimit,
} from '@/lib/usage-config'

export const dynamic = 'force-dynamic'

type PlanData = {
  id: string
  price_monthly: number
  price_yearly: number
}

export default async function PlanosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: plans } = await supabase.from('plans').select('id, price_monthly, price_yearly')

  const proPlan = (plans as PlanData[] | null)?.find((p) => p.id === 'pro')

  const priceMonthly = proPlan?.price_monthly ?? 10
  const priceYearly = proPlan?.price_yearly ?? 95
  const savings = priceMonthly > 0 ? Math.round((1 - priceYearly / (priceMonthly * 12)) * 100) : 0

  const freeSimLimit = getDefaultFreeSimulationsLimit()
  const freeCompLimit = getDefaultFreeComparisonsLimit()
  const freeCompatLimit = getDefaultFreeCompatibilityLimit()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 sm:text-sm">
                Preços
              </span>
            </div>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Planos e preços
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg lg:text-xl">
              No Free você usa todas as telas com limites separados por tipo; no Pro, histórico e uso avançado
              ficam ilimitados.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-2 lg:items-stretch">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm sm:p-8">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Free</div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white sm:text-5xl">R$ 0</span>
                <span className="text-slate-400">/mês</span>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-slate-400">
                Todas as telas liberadas; cada tipo de uso tem seu próprio saldo no plano Free (valores padrão
                abaixo — configuráveis no app).
              </p>

              <ul className="mb-8 flex-1 space-y-3 text-left">
                <li className="flex items-start gap-3 text-slate-200">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>
                    Simulação mensal, compatibilidade, comparador CLT × PJ, 13º, férias, rescisão, histórico e
                    dashboard
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>
                    Até <strong className="text-white">{freeSimLimit}</strong> simulações salvas no histórico
                    (mensal, 13º, férias, rescisão)
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>
                    Até <strong className="text-white">{freeCompLimit}</strong> comparações CLT × PJ salvas
                    (&quot;Comparar e salvar&quot;)
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>
                    Até <strong className="text-white">{freeCompatLimit}</strong> análises de compatibilidade
                    (ao abrir o resultado completo)
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-500">
                  <span className="mt-0.5 shrink-0" aria-hidden>
                    ✗
                  </span>
                  <span>Uso ilimitado (simulações, comparações e compatibilidade) — somente Pro</span>
                </li>
              </ul>

              <Link
                href="/cadastro"
                className="mt-auto flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-center font-semibold text-white transition-all hover:bg-white/10"
              >
                Criar conta grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm sm:p-8">
              <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-bold text-white">
                POPULAR
              </div>

              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-400">Pro</div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white sm:text-5xl">
                  R${' '}
                  {priceMonthly.toLocaleString('pt-BR', {
                    minimumFractionDigits: priceMonthly % 1 === 0 ? 0 : 2,
                  })}
                </span>
                <span className="text-slate-400">/mês</span>
              </div>

              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <span className="text-sm text-slate-400">ou</span>
                <span className="text-slate-200">
                  <span className="text-2xl font-bold text-white">
                    R${' '}
                    {priceYearly.toLocaleString('pt-BR', {
                      minimumFractionDigits: priceYearly % 1 === 0 ? 0 : 2,
                    })}
                  </span>
                  <span className="ml-1 text-sm text-slate-400">/ano</span>
                </span>
                {savings > 0 && (
                  <span className="w-fit rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    Economize {savings}%
                  </span>
                )}
              </div>
              <div className="mb-6 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                ✨ 14 dias grátis para experimentar
              </div>

              <ul className="mb-8 flex-1 space-y-3 text-left">
                <li className="flex items-start gap-3 text-white">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>Tudo do plano Free, com simulações ilimitadas</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>Histórico completo, gráficos e dashboard avançado</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>Comparador CLT × PJ, 13º, férias e rescisão</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>Exportação de dados</span>
                </li>
              </ul>

              <Link
                href="/cadastro"
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
              >
                Assinar Pro
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-6 text-center sm:mt-12 sm:p-8">
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              <strong className="text-white">Nota:</strong> os cálculos são estimativas. Sempre valide com seu RH
              ou contador para valores oficiais. Os preços do Pro podem ser consultados no checkout.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
