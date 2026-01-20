import '@/lib/polyfills'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
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
  
  // Sempre começar de 2026/01 (Janeiro 2026)
  const startYear = 2026
  const startMonth = 0 // Janeiro
  const start = new Date(startYear, startMonth, 1)
  
  // Data atual para incluir meses futuros
  const hoje = new Date()
  const hojeMonth = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  
  // Usar a data mais recente entre endDate e hoje como referência
  const referenceDate = end >= hojeMonth ? end : hojeMonth
  
  // Calcular quantos meses temos desde 2026/01 até a data de referência
  const monthsFromStart = (referenceDate.getFullYear() - startYear) * 12 + (referenceDate.getMonth() - startMonth) + 1
  
  // Se temos menos de N meses, começar do início de 2026
  if (monthsFromStart < n) {
    let current = new Date(start)
    let count = 0
    while (count < n) {
      keys.push(monthKey(current))
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      count++
    }
  } else {
    // Gerar N meses, incluindo meses futuros a partir da data de referência
    // Começar alguns meses antes e ir até alguns meses depois
    const monthsBefore = Math.floor(n * 0.6) // 60% dos meses são passados
    const monthsAfter = n - monthsBefore // 40% são futuros
    
    // Gerar meses passados
    for (let i = monthsBefore - 1; i >= 0; i--) {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1)
      if (d >= start) {
        keys.push(monthKey(d))
      }
    }
    
    // Gerar meses futuros
    for (let i = 1; i <= monthsAfter; i++) {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + i, 1)
      keys.push(monthKey(d))
    }
  }
  
  return keys.slice(0, n) // Garante que sempre retorna exatamente N meses
}

// Função auxiliar para buscar simulações (usada no cache)
async function getSimulationsData(userId: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('simulations')
    .select('created_at, contract_type, input_json, result_json')
    .eq('user_id', userId)
    .contains('input_json', { kind: 'monthly' })
    .order('created_at', { ascending: true })
    .limit(200)
  return { data, error }
}

export default async function DashboardPage() {
  const profile = await requireUser()
  
  // Computar valores antes do JSX
  const greeting = getGreeting()
  const displayName = getDisplayName(profile)

  // Cache da query por 30 segundos (revalida quando tag é invalidada)
  const getCachedSimulations = unstable_cache(
    async () => getSimulationsData(profile.id),
    [`simulations-${profile.id}`],
    { revalidate: 30, tags: [`simulations-${profile.id}`] }
  )

  const { data, error } = await getCachedSimulations()

  const rows = ((data ?? []) as SimulationRow[]).filter((r) => String(r.input_json?.kind) === 'monthly')

  // Agrupa simulações por mês/ano da simulação, mantendo a mais recente quando houver duplicatas
  const seriesMap = new Map<string, { liquido: number; created_at: Date }>()
  let maxCreatedAt: Date | null = null
  
  for (const r of rows) {
    const liquido = Number(r.result_json?.liquido ?? 0)
    const created_at = new Date(r.created_at)
    
    // Usa o mês/ano da simulação se disponível, senão usa a data de criação
    let simDate: Date
    const inputMonth = r.input_json?.month
    const inputYear = r.input_json?.year
    
    if (inputMonth && inputYear && inputMonth >= 1 && inputMonth <= 12) {
      // Usa o mês/ano especificado na simulação (mês vem como 1-12)
      simDate = new Date(inputYear, inputMonth - 1, 1)
    } else {
      // Fallback: usa a data de criação
      simDate = new Date(created_at)
    }
    
    const key = monthKey(simDate)
    const existing = seriesMap.get(key)
    
    // Se não existe simulação para este mês, ou se esta é mais recente, atualiza
    if (!existing || created_at > existing.created_at) {
      seriesMap.set(key, { liquido, created_at })
    }
    
    // Atualiza a data de criação mais recente
    if (!maxCreatedAt || created_at > maxCreatedAt) {
      maxCreatedAt = created_at
    }
  }

  // Cria um map simples com apenas os valores líquidos para o gráfico
  const liquidoMap = new Map<string, number>()
  for (const [key, value] of seriesMap) {
    liquidoMap.set(key, value.liquido)
  }

  // Para calcular endDate, pega o mês/ano mais recente das simulações
  let endDate = maxCreatedAt ?? new Date()
  
  // Se houver simulações com mês/ano futuro, ajusta o endDate
  for (const [key] of seriesMap) {
    const [year, month] = key.split('-').map(Number)
    const simDate = new Date(year, month - 1, 1)
    if (simDate > endDate) {
      endDate = simDate
    }
  }
  const keys = lastNMonthKeys(endDate, 12)
  const hoje = new Date()
  const currentMonthKey = monthKey(hoje)
  const series = keys.map((k) => ({
    month: monthLabel(k),
    liquido: liquidoMap.get(k) ?? null,
    isCurrent: k === currentMonthKey,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
            {greeting}, <span className="text-emerald-400">{displayName}</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm transition-all hover:border-emerald-500/30 sm:rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
              Bruto
            </div>
            <DollarSign size={16} className="text-slate-500 transition-colors group-hover:text-emerald-400 sm:h-5 sm:w-5" />
          </div>
          <div className="mt-2 text-lg font-bold tabular-nums text-slate-50 sm:mt-3 sm:text-2xl">
            {formatBRL(metrics.bruto)}
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm transition-all hover:border-emerald-500/30 sm:rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
              Adicionais
            </div>
            <Plus size={16} className="text-slate-500 transition-colors group-hover:text-emerald-400 sm:h-5 sm:w-5" />
          </div>
          <div className="mt-2 text-lg font-bold tabular-nums text-emerald-400 sm:mt-3 sm:text-2xl">
            {formatBRL(metrics.adicionais)}
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm transition-all hover:border-rose-500/30 sm:rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
              Descontos
            </div>
            <Minus size={16} className="text-slate-500 transition-colors group-hover:text-rose-400 sm:h-5 sm:w-5" />
          </div>
          <div className="mt-2 text-lg font-bold tabular-nums text-rose-400 sm:mt-3 sm:text-2xl">
            {formatBRL(metrics.descontos)}
          </div>
        </div>

        <div className="group col-span-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 backdrop-blur-sm transition-all hover:border-emerald-500/40 sm:rounded-2xl sm:p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-300 sm:text-xs">
              Líquido
            </div>
            <TrendingUp size={16} className="text-emerald-400 sm:h-5 sm:w-5" />
          </div>
          <div className="mt-2 text-lg font-bold tabular-nums text-emerald-300 sm:mt-3 sm:text-2xl">
            {formatBRL(metrics.liquido)}
          </div>
        </div>
      </div>

      {/* Gráfico de evolução */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-4 backdrop-blur-sm sm:rounded-2xl sm:p-6">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Evolução do Salário Líquido</h2>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Últimos 12 meses (apenas simulações mensais)
          </p>
        </div>
        {hasSeries ? (
          <div className="mt-4">
            <MonthlyNetChart data={series} />
            <p className="mt-2 text-center text-[10px] text-slate-500">
              * Valores estimados
            </p>
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

