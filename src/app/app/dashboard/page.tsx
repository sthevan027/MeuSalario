import '@/lib/polyfills'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { requireUser } from '@/lib/auth/profile'
import { getGreeting, getDisplayName } from '@/lib/greetings'
import { TrendingUp, DollarSign, Plus, Minus } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { AnnualForecast } from '@/components/dashboard/AnnualForecast'
import { SavingsMetrics } from '@/components/dashboard/SavingsMetrics'

const MonthlyNetChart = dynamic(
  () => import('@/components/charts/MonthlyNetChart').then(mod => ({ default: mod.MonthlyNetChart })),
  { ssr: false, loading: () => <div className="flex h-64 items-center justify-center text-slate-500">Carregando gráfico...</div> }
)

const CltVsPjChart = dynamic(
  () => import('@/components/charts/CltVsPjChart').then(mod => ({ default: mod.CltVsPjChart })),
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

// Função auxiliar para buscar simulações mensais (usada no cache)
async function getSimulationsData(userId: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('simulations')
    .select('created_at, contract_type, input_json, result_json')
    .eq('user_id', userId)
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

  // Filtra APENAS simulações mensais (não rescisão, não comparador)
  const rows = ((data ?? []) as SimulationRow[]).filter((r) => {
    const kind = String(r.input_json?.kind ?? '')
    // Apenas simulações mensais têm kind === 'monthly'
    // Rescisão tem kind === 'termination'
    // Comparador tem kind === 'compare'
    return kind === 'monthly'
  })

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

  // Preparar dados para estatísticas (serializar Date para passar para componente cliente)
  const statsData = rows.map((r) => ({
    liquido: Number(r.result_json?.liquido ?? 0),
    created_at: r.created_at, // String já serializada
    contract_type: r.contract_type,
  }))

  // Preparar dados para gráfico CLT vs PJ
  // As simulações de comparação são salvas como dois registros (CLT e PJ) com o mesmo created_at
  const compareRows = ((data ?? []) as SimulationRow[]).filter((r) => {
    const kind = String(r.input_json?.kind ?? '')
    return kind === 'compare'
  })

  // Agrupa por created_at (comparações são salvas juntas)
  const compareGroups = new Map<string, { clt?: number; pj?: number; date: Date }>()
  
  for (const r of compareRows) {
    const result = r.result_json
    const liquido = Number(result?.liquido ?? 0)
    const created_at = new Date(r.created_at)
    const groupKey = created_at.toISOString().split('T')[0] // Agrupa por dia
    
    const existing = compareGroups.get(groupKey) || { date: created_at }
    
    if (r.contract_type === 'clt') {
      existing.clt = liquido
    } else if (r.contract_type === 'pj') {
      existing.pj = liquido
    }
    
    compareGroups.set(groupKey, existing)
  }

  // Mapeia para meses
  const cltVsPjByMonth = new Map<string, { clt: number; pj: number }>()
  for (const [_, group] of compareGroups) {
    if (group.clt !== undefined && group.pj !== undefined) {
      const key = monthKey(group.date)
      cltVsPjByMonth.set(key, { clt: group.clt, pj: group.pj })
    }
  }

  const cltVsPjSeries = keys.map((k) => {
    const data = cltVsPjByMonth.get(k)
    const clt = data?.clt ?? null
    const pj = data?.pj ?? null
    const difference = clt !== null && pj !== null ? pj - clt : null
    
    return {
      month: monthLabel(k),
      clt,
      pj,
      difference,
    }
  })

  const hasCltVsPjData = cltVsPjSeries.some((p) => p.clt !== null || p.pj !== null)

  // Dashboard disponível para Free e Pro
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">
                {greeting}, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{displayName}</span>
                <span className="ml-2 inline-block animate-pulse">👋</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 sm:text-base">
                Acompanhe sua evolução financeira em tempo real
              </p>
            </div>
            {hasSeries && (
              <div className="hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 sm:block">
                <div className="text-xs font-medium text-emerald-300">Status</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-emerald-200">Ativo</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
          Erro ao carregar simulações: {error.message}
        </div>
      ) : null}

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Bruto */}
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-700/40 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-slate-400/40 hover:shadow-xl sm:rounded-2xl sm:p-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-slate-400/10 blur-2xl transition-all group-hover:bg-slate-400/20" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-slate-500/20 p-2">
                  <DollarSign size={20} className="text-slate-300" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bruto
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-50 sm:text-3xl">
              {formatBRL(metrics.bruto)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Salário base total
            </div>
          </div>
        </div>

        {/* Adicionais */}
        <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/20 sm:rounded-2xl sm:p-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <Plus size={20} className="text-emerald-400" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
                  Adicionais
                </div>
              </div>
              {metrics.adicionais > 0 && (
                <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  BÔNUS
                </div>
              )}
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-300 sm:text-3xl">
              {formatBRL(metrics.adicionais)}
            </div>
            <div className="mt-2 text-xs text-emerald-400/70">
              Horas extras e outros
            </div>
          </div>
        </div>

        {/* Descontos */}
        <div className="group relative overflow-hidden rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-rose-400/40 hover:shadow-xl hover:shadow-rose-500/20 sm:rounded-2xl sm:p-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-500/20 p-2">
                  <Minus size={20} className="text-rose-400" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-300/90">
                  Descontos
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold tabular-nums text-rose-300 sm:text-3xl">
              {formatBRL(metrics.descontos)}
            </div>
            <div className="mt-2 text-xs text-rose-400/70">
              INSS, IRRF e outros
            </div>
          </div>
        </div>

        {/* Líquido - Destaque */}
        <div className="group relative col-span-2 overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/10 p-6 backdrop-blur-sm transition-all hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/30 sm:rounded-2xl sm:p-7 lg:col-span-1">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl transition-all group-hover:bg-emerald-500/30" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-500/30 p-2.5">
                  <TrendingUp size={24} className="text-emerald-300" />
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-200">
                  Líquido
                </div>
              </div>
              <div className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                ATUAL
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums text-emerald-200 sm:text-4xl">
              {formatBRL(metrics.liquido)}
            </div>
            <div className="mt-3 text-xs font-medium text-emerald-300/80">
              💰 Valor que você recebe
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      {hasSeries && statsData.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-slate-900/30 p-6 backdrop-blur-sm sm:p-8">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/20 p-3">
                <TrendingUp size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Estatísticas</h2>
                <p className="text-sm text-slate-400">
                  Análise dos últimos <span className="font-semibold text-blue-400">{statsData.length}</span> meses
                </p>
              </div>
            </div>
            <DashboardStats simulations={statsData} />
          </div>
        </div>
      )}

      {/* Métricas de Economia */}
      {hasSeries && statsData.length > 1 && (
        <SavingsMetrics simulations={statsData} />
      )}

      {/* Previsão Anual */}
      {hasSeries && statsData.length > 0 && (
        <AnnualForecast simulations={statsData} />
      )}

      {/* Gráfico de evolução */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-slate-900/30 p-6 backdrop-blur-sm sm:p-8">
        <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-3">
              <TrendingUp size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Evolução do Salário Líquido</h2>
              <p className="text-sm text-slate-400">
                Últimos 12 meses • Simulações mensais
              </p>
            </div>
          </div>
          {hasSeries ? (
            <>
              <MonthlyNetChart data={series} />
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <div className="h-1 w-1 rounded-full bg-slate-500" />
                <span>Valores estimados baseados em suas simulações</span>
                <div className="h-1 w-1 rounded-full bg-slate-500" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 py-16 text-center">
              <div className="mb-4 rounded-full bg-emerald-500/10 p-4">
                <TrendingUp size={48} className="text-emerald-500/50" />
              </div>
              <p className="mb-2 text-lg font-semibold text-slate-300">Nenhuma simulação encontrada</p>
              <p className="mb-6 max-w-sm text-sm text-slate-400">
                Comece fazendo sua primeira simulação para acompanhar a evolução do seu salário líquido
              </p>
              <Link
                href="/app/simulacao"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40"
              >
                Fazer Simulação
                <TrendingUp size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico CLT vs PJ */}
      {hasCltVsPjData && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-slate-900/30 p-6 backdrop-blur-sm sm:p-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3">
                <TrendingUp size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Comparação CLT vs PJ</h2>
                <p className="text-sm text-slate-400">
                  Evolução comparativa ao longo do tempo
                </p>
              </div>
            </div>
            <CltVsPjChart data={cltVsPjSeries} />
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="h-1 w-1 rounded-full bg-slate-500" />
              <span>Baseado nas suas simulações de comparação CLT x PJ</span>
              <div className="h-1 w-1 rounded-full bg-slate-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

