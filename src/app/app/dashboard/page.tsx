import '@/lib/polyfills'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { createSupabaseServerClient, type CookieStore } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { requireUser } from '@/lib/auth/profile'
import { getGreeting, getDisplayName } from '@/lib/greetings'
import { LazyChart } from '@/components/charts/LazyChart'
import { FeedbackForm } from '@/components/FeedbackForm'

const MonthlyNetChart = dynamic(
  () => import('@/components/charts/MonthlyNetChart').then(mod => ({ default: mod.MonthlyNetChart })),
  { ssr: false }
)

const CltVsPjChart = dynamic(
  () => import('@/components/charts/CltVsPjChart').then(mod => ({ default: mod.CltVsPjChart })),
  { ssr: false }
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

// Função auxiliar para buscar simulações mensais (usada no cache).
// cookieStore deve ser obtido fora do unstable_cache e passado como argumento.
async function getSimulationsData(userId: string, cookieStore: CookieStore) {
  const supabase = createSupabaseServerClient(cookieStore)
  const { data, error } = await supabase
    .from('simulations')
    .select('created_at, contract_type, input_json, result_json')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(120)
  return { data, error }
}

export default async function DashboardPage() {
  const profile = await requireUser()
  
  // Computar valores antes do JSX
  const greeting = getGreeting()
  const displayName = getDisplayName(profile)

  // cookies() fora do cache (fonte dinâmica não pode ser usada dentro de unstable_cache)
  const cookieStore = cookies()

  // Cache da query por 60s (menos hits no Supabase; revalida com tag)
  const getCachedSimulations = unstable_cache(
    async (store: CookieStore) => getSimulationsData(profile.id, store),
    [`simulations-${profile.id}`],
    { revalidate: 60, tags: [`simulations-${profile.id}`] }
  )

  const { data, error } = await getCachedSimulations(cookieStore)

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

  // Valor anual: soma dos líquidos dos últimos 12 meses (ou projeção média × 12)
  const valorAnual = series.reduce((acc, p) => acc + (p.liquido ?? 0), 0)
  const mesesComDado = series.filter((p) => p.liquido != null).length
  const valorAnualProjecao = mesesComDado > 0 ? (valorAnual / mesesComDado) * 12 : metrics.liquido * 12

  // Dashboard disponível para Free e Pro
  return (
    <div className="space-y-6">
      {/* Header simples */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
            {greeting}, <span className="text-emerald-400">{displayName}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acompanhe sua evolução financeira em tempo real
          </p>
        </div>
        {hasSeries && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Ativo</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Erro ao carregar simulações: {error.message}
        </div>
      ) : null}

      <section className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:max-w-md">
            <h2 className="text-lg font-semibold text-white">Atualizações & Feedback</h2>
            <p className="mt-1 text-sm text-slate-300">
              Acompanhe as novidades mais recentes e envie sugestões direto pelo formulário integrado.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/app/atualizacoes"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Ver atualizações
              </Link>
            </div>
          </div>
          <div className="w-full lg:max-w-xl">
            <FeedbackForm
              initialPage="Dashboard"
              showPageField={false}
              submitLabel="Enviar sugestão"
            />
          </div>
        </div>
      </section>

      {/* 4 cards: mesmo estilo, só o texto com cor */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bruto</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-slate-50 sm:text-2xl">
            {formatBRL(metrics.bruto)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Salário base total</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Adicionais</span>
            {metrics.adicionais > 0 && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">BÔNUS</span>
            )}
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-emerald-400 sm:text-2xl">
            {formatBRL(metrics.adicionais)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Horas extras e outros</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">Descontos</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-rose-400 sm:text-2xl">
            {formatBRL(metrics.descontos)}
          </div>
          <div className="mt-1 text-xs text-slate-500">INSS, IRRF e outros</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Líquido</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">ATUAL</span>
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-emerald-400 sm:text-2xl">
            {formatBRL(metrics.liquido)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Valor que você recebe</div>
        </div>
      </div>

      {/* Retângulo Valor Anual */}
      <div className="rounded-xl border border-white/10 bg-slate-800/40 px-5 py-4">
        <div className="text-sm font-medium text-slate-400">Valor anual (previsão)</div>
        <div className="mt-1 text-2xl font-bold tabular-nums text-slate-50 sm:text-3xl">
          {formatBRL(mesesComDado >= 12 ? valorAnual : valorAnualProjecao)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {mesesComDado >= 12
            ? 'Soma dos últimos 12 meses'
            : `Projeção (média × 12 • ${mesesComDado} ${mesesComDado === 1 ? 'mês' : 'meses'} de dado)`}
        </div>
      </div>

      {/* Gráfico de evolução do salário líquido */}
      <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">Evolução do salário líquido</h2>
        <p className="mt-0.5 text-sm text-slate-500">Últimos 12 meses</p>
        {hasSeries ? (
          <div className="mt-4">
            <LazyChart fallback="Carregando gráfico...">
              <MonthlyNetChart data={series} />
            </LazyChart>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-12 text-center">
            <p className="text-slate-400">Nenhuma simulação ainda</p>
            <p className="mt-1 text-sm text-slate-500">Faça uma simulação para ver o gráfico</p>
            <Link
              href="/app/simulacao"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Fazer simulação
            </Link>
          </div>
        )}
      </div>

      {/* CLT vs PJ */}
      {hasCltVsPjData && (
        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-100">CLT vs PJ</h2>
          <p className="mt-0.5 text-sm text-slate-500">Comparação ao longo do tempo</p>
          <div className="mt-4">
            <LazyChart fallback="Carregando gráfico...">
              <CltVsPjChart data={cltVsPjSeries} />
            </LazyChart>
          </div>
        </div>
      )}
    </div>
  )
}
