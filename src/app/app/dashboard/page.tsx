import '@/lib/polyfills'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { requireUser } from '@/lib/auth/profile'
import { getGreeting, getDisplayName } from '@/lib/greetings'
import { TrendingUp, DollarSign, Plus, Minus, Sparkles } from 'lucide-react'
import { UpgradeCta } from '@/components/billing/UpgradeCta'

const MonthlyNetChart = dynamic(
  () => import('@/components/charts/MonthlyNetChart').then(mod => ({ default: mod.MonthlyNetChart })),
  { ssr: false, loading: () => <div className="flex h-64 items-center justify-center text-slate-500">Carregando gráfico...</div> }
)

type SimulationRow = {
  created_at: string
  contract_type: 'clt' | 'pj'
  input_json: any
  result_json: any
}

function monthKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${m}/${y}`
}

function lastNMonthKeys(endDate: Date, n = 12) {
  const keys: string[] = []
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

export default async function DashboardPage() {
  const profile = await requireUser()
  const supabase = createSupabaseServerClient()

  // Computar valores antes do JSX
  const greeting = getGreeting()
  const displayName = getDisplayName(profile)

  const { data, error } = await supabase
    .from('simulations')
    .select('created_at, contract_type, input_json, result_json')
    .contains('input_json', { kind: 'monthly' })
    .order('created_at', { ascending: true })
    .limit(200)

  const rows = ((data ?? []) as SimulationRow[]).filter((r) => String(r.input_json?.kind) === 'monthly')

  const seriesMap = new Map<string, number>()
  for (const r of rows) {
    const key = monthKey(new Date(r.created_at))
    const liquido = Number(r.result_json?.liquido ?? 0)
    seriesMap.set(key, liquido)
  }

  const endDate = rows.length ? new Date(rows[rows.length - 1].created_at) : new Date()
  const keys = lastNMonthKeys(endDate, 12)
  const series = keys.map((k) => ({
    month: monthLabel(k),
    liquido: seriesMap.get(k) ?? null,
  }))
  const hasSeries = series.some((p) => typeof p.liquido === 'number')

  const last = rows.length ? rows[rows.length - 1] : null
  const lastResult = last?.result_json ?? null
  
  // Serializar valores para garantir que são seguros para componentes cliente
  const metrics = {
    bruto: Number(lastResult?.bruto ?? 0),
    adicionais: Number(lastResult?.adicionais ?? 0),
    descontos: Number(lastResult?.descontos ?? 0),
    liquido: Number(lastResult?.liquido ?? 0),
  }

  if (profile.plan !== 'pro') {
    // Usuário Free - mostrar paywall do Dashboard
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                <Sparkles size={32} className="text-white" />
              </div>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-slate-100">Dashboard é exclusivo Pro</h1>
            <p className="mb-6 text-lg text-slate-300">
              Tenha acesso a gráficos avançados, histórico completo, comparações CLT x PJ e muito mais.
            </p>
            <div className="mb-6 grid gap-3 text-left text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Evolução mensal do seu salário líquido
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Histórico completo de todas as simulações
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Comparador CLT x PJ com análise detalhada
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Simulação de rescisão trabalhista
              </div>
            </div>
            <UpgradeCta />
          </div>
        </div>
      </div>
    )
  }

  // Usuário Pro - mostrar dashboard completo
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            {greeting}, <span className="text-emerald-400">{displayName}</span>
          </h1>
          <p className="mt-1 text-slate-400">
            Aqui está um resumo das suas simulações
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
          Erro ao carregar simulações: {error.message}
        </div>
      ) : null}

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Bruto Previsto
            </div>
            <DollarSign size={20} className="text-slate-500 transition-colors group-hover:text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-slate-50">
            {formatBRL(metrics.bruto)}
          </div>
        </div>

        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Adicionais
            </div>
            <Plus size={20} className="text-slate-500 transition-colors group-hover:text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-emerald-400">
            {formatBRL(metrics.adicionais)}
          </div>
        </div>

        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-rose-500/30">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Descontos
            </div>
            <Minus size={20} className="text-slate-500 transition-colors group-hover:text-rose-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-rose-400">
            {formatBRL(metrics.descontos)}
          </div>
        </div>

        <div className="group rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-300">
              Líquido Previsto
            </div>
            <TrendingUp size={20} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-emerald-300">
            {formatBRL(metrics.liquido)}
          </div>
        </div>
      </div>

      {/* Gráfico de evolução */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-6 backdrop-blur-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">Evolução do Salário Líquido</h2>
          <p className="mt-1 text-sm text-slate-400">
            Últimos 12 meses (apenas simulações mensais)
          </p>
        </div>
        {hasSeries ? (
          <div className="mt-4">
            <MonthlyNetChart data={series} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
            <TrendingUp size={48} className="mb-4 text-slate-600" />
            <p className="mb-2 text-lg font-medium text-slate-300">Nenhuma simulação encontrada</p>
            <p className="mb-4 text-sm text-slate-400">
              Faça sua primeira simulação para começar a acompanhar sua evolução salarial
            </p>
            <Link
              href="/app/simulacao"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Fazer Simulação
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

