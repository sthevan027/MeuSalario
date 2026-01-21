'use client'

import { useMemo } from 'react'
import { formatBRL } from '@/lib/format'
import { TrendingUp, Calendar } from 'lucide-react'
import dynamic from 'next/dynamic'

const AnnualForecastChart = dynamic(
  () => import('@/components/charts/AnnualForecastChart').then(mod => ({ default: mod.AnnualForecastChart })),
  { ssr: false, loading: () => <div className="flex h-64 items-center justify-center text-slate-500">Carregando gráfico...</div> }
)

type SimulationData = {
  liquido: number
  created_at: string | Date
  contract_type: 'clt' | 'pj'
}

type Props = {
  simulations: SimulationData[]
}

export function AnnualForecast({ simulations }: Props) {
  const forecast = useMemo(() => {
    if (simulations.length === 0) return null

    const valores = simulations.map((s) => s.liquido).filter((v) => v > 0)
    if (valores.length === 0) return null

    // Calcula média dos últimos 3-6 meses
    const recentMonths = Math.min(valores.length, 6)
    const recentValues = valores.slice(-recentMonths)
    const mediaMensal = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length

    // Calcula tendência (regressão linear simples)
    let tendencia = 0
    if (recentValues.length >= 2) {
      const n = recentValues.length
      const sumX = recentValues.reduce((acc, _, i) => acc + i, 0)
      const sumY = recentValues.reduce((acc, v) => acc + v, 0)
      const sumXY = recentValues.reduce((acc, v, i) => acc + i * v, 0)
      const sumX2 = recentValues.reduce((acc, _, i) => acc + i * i, 0)

      tendencia = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    }

    // Projeção anual (12 meses)
    const hoje = new Date()
    const currentMonth = hoje.getMonth() + 1 // 1-12
    const currentYear = hoje.getFullYear()
    
    // Calcula meses restantes no ano atual
    const mesesRestantes = 12 - currentMonth
    
    // Projeção para os próximos meses do ano
    const mesesProjecao = Array.from({ length: mesesRestantes }, (_, i) => {
      const mes = currentMonth + i + 1
      const ano = mes > 12 ? currentYear + 1 : currentYear
      const mesAjustado = mes > 12 ? mes - 12 : mes
      
      // Valor projetado com tendência
      const valorProjetado = mediaMensal + (tendencia * (i + 1))
      
      return {
        mes: mesAjustado,
        ano,
        valor: Math.max(0, valorProjetado),
      }
    })

    // Total anual: valores já recebidos + projeção
    const totalRecebido = valores.reduce((sum, v) => sum + v, 0)
    const totalProjetado = mesesProjecao.reduce((sum, m) => sum + m.valor, 0)
    const totalAnual = totalRecebido + totalProjetado
    const mediaAnual = totalAnual / 12

    return {
      mediaMensal,
      tendencia,
      mesesProjecao,
      totalAnual,
      mediaAnual,
      mesesRestantes,
    }
  }, [simulations])

  if (!forecast) return null

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="space-y-4">
      <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-800/40 to-slate-900/40 p-6 backdrop-blur-sm transition-all hover:border-purple-400/30 sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        
        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/20 p-3">
              <Calendar size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Previsão Anual</h3>
              <p className="text-sm text-slate-400">Projeção baseada nos seus dados</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Total Projetado */}
            <div className="group/card relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-5 transition-all hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover/card:bg-purple-500/20" />
              
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-purple-500/20 p-1.5">
                    <TrendingUp size={16} className="text-purple-400" />
                  </div>
                  <div className="text-xs font-medium text-purple-300/90">Total Projetado</div>
                </div>
                <div className="text-3xl font-bold tabular-nums text-purple-200">
                  {formatBRL(forecast.totalAnual)}
                </div>
                <div className="mt-2 rounded-lg bg-purple-500/10 px-2 py-1 text-xs text-purple-300/80">
                  🎯 Previsão para 12 meses
                </div>
              </div>
            </div>

            {/* Média Mensal */}
            <div className="group/card relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-5 transition-all hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover/card:bg-indigo-500/20" />
              
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-500/20 p-1.5">
                    <Calendar size={16} className="text-indigo-400" />
                  </div>
                  <div className="text-xs font-medium text-indigo-300/90">Média Mensal</div>
                </div>
                <div className="text-3xl font-bold tabular-nums text-indigo-200">
                  {formatBRL(forecast.mediaAnual)}
                </div>
                <div className="mt-2 rounded-lg bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300/80">
                  📊 Valor médio esperado
                </div>
              </div>
            </div>
          </div>

          {forecast.tendencia !== 0 && (
            <div className={`mt-4 flex items-center gap-3 rounded-xl border p-4 transition-all ${
              forecast.tendencia > 0 
                ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5' 
                : 'border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-rose-600/5'
            }`}>
              <div className={`rounded-lg p-2 ${
                forecast.tendencia > 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              }`}>
                <TrendingUp size={20} className={forecast.tendencia > 0 ? 'text-emerald-400' : 'text-rose-400'} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-200">
                  {forecast.tendencia > 0 ? 'Tendência de Crescimento' : 'Tendência de Queda'}
                </div>
                <div className="text-xs text-slate-400">
                  {forecast.tendencia > 0 ? '↗' : '↘'} {formatBRL(Math.abs(forecast.tendencia))} por mês
                </div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                forecast.tendencia > 0 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {forecast.tendencia > 0 ? 'POSITIVA' : 'NEGATIVA'}
              </div>
            </div>
          )}

        {forecast.mesesProjecao.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-200">Projeção dos Próximos {forecast.mesesRestantes} meses</div>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-slate-900/30 p-4">
              <AnnualForecastChart 
                data={forecast.mesesProjecao.map(m => ({
                  month: `${monthNames[m.mes - 1]}/${m.ano}`,
                  value: m.valor,
                  mes: m.mes,
                  ano: m.ano
                }))}
                tendencia={forecast.tendencia}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
