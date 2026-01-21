'use client'

import { useMemo } from 'react'
import { formatBRL } from '@/lib/format'
import { TrendingDown, TrendingUp, PiggyBank } from 'lucide-react'

type SimulationData = {
  liquido: number
  created_at: string | Date
  contract_type: 'clt' | 'pj'
}

type Props = {
  simulations: SimulationData[]
}

export function SavingsMetrics({ simulations }: Props) {
  const metrics = useMemo(() => {
    if (simulations.length < 2) return null

    const valores = simulations.map((s) => s.liquido).filter((v) => v > 0)
    if (valores.length < 2) return null

    // Ordena por data
    const sorted = [...simulations].sort((a, b) => {
      const dateA = typeof a.created_at === 'string' ? new Date(a.created_at) : a.created_at
      const dateB = typeof b.created_at === 'string' ? new Date(b.created_at) : b.created_at
      return dateA.getTime() - dateB.getTime()
    })

    const sortedValores = sorted.map((s) => s.liquido).filter((v) => v > 0)
    
    // Compara com estimativa anterior (primeira simulação)
    const primeiraEstimativa = sortedValores[0]
    const ultimoValor = sortedValores[sortedValores.length - 1]
    const diferenca = ultimoValor - primeiraEstimativa

    // Calcula economia média (comparando com a primeira estimativa)
    const economiaTotal = sortedValores.reduce((acc, val, idx) => {
      if (idx === 0) return acc
      const diff = val - primeiraEstimativa
      return acc + (diff > 0 ? diff : 0)
    }, 0)

    const economiaMedia = economiaTotal / (sortedValores.length - 1)

    // Calcula quantos meses tiveram "economia" (valor maior que a primeira estimativa)
    const mesesComEconomia = sortedValores.filter((v) => v > primeiraEstimativa).length
    const percentualMesesComEconomia = (mesesComEconomia / sortedValores.length) * 100

    return {
      primeiraEstimativa,
      ultimoValor,
      diferenca,
      economiaTotal,
      economiaMedia,
      mesesComEconomia,
      percentualMesesComEconomia,
      totalMeses: sortedValores.length,
    }
  }, [simulations])

  if (!metrics) return null

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-800/40 to-slate-900/40 p-6 backdrop-blur-sm transition-all hover:border-emerald-400/30 sm:p-8">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      
      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-3">
            <PiggyBank size={24} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Métricas de Economia</h3>
            <p className="text-sm text-slate-400">Análise de performance financeira</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Diferença vs Primeira */}
          <div className={`group/card relative overflow-hidden rounded-xl border p-5 transition-all ${
            metrics.diferenca >= 0 
              ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20' 
              : 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/5 hover:border-rose-400/40 hover:shadow-lg hover:shadow-rose-500/20'
          }`}>
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-all ${
              metrics.diferenca >= 0 ? 'bg-emerald-500/10 group-hover/card:bg-emerald-500/20' : 'bg-rose-500/10 group-hover/card:bg-rose-500/20'
            }`} />
            
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown size={18} className={metrics.diferenca >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                  <div className="text-xs font-medium text-slate-300">Evolução</div>
                </div>
                {metrics.diferenca >= 0 ? (
                  <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    GANHO
                  </div>
                ) : (
                  <div className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    QUEDA
                  </div>
                )}
              </div>
              
              <div className={`text-3xl font-bold tabular-nums ${metrics.diferenca >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {metrics.diferenca >= 0 ? '+' : ''}{formatBRL(metrics.diferenca)}
              </div>
              
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-medium">Primeira:</span>
                <span className="tabular-nums">{formatBRL(metrics.primeiraEstimativa)}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-medium">Atual:</span>
                <span className="tabular-nums">{formatBRL(metrics.ultimoValor)}</span>
              </div>
            </div>
          </div>

          {/* Economia Total */}
          <div className="group/card relative overflow-hidden rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-teal-500/5 p-5 transition-all hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/20">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl transition-all group-hover/card:bg-teal-500/20" />
            
            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-teal-500/20 p-1.5">
                  <PiggyBank size={16} className="text-teal-400" />
                </div>
                <div className="text-xs font-medium text-slate-300">Economia Acumulada</div>
              </div>
              
              <div className="text-3xl font-bold tabular-nums text-teal-300">
                {formatBRL(metrics.economiaTotal)}
              </div>
              
              <div className="mt-3 rounded-lg bg-teal-500/10 px-3 py-2">
                <div className="text-[11px] text-teal-300/80">
                  Média por mês
                </div>
                <div className="text-sm font-bold tabular-nums text-teal-200">
                  {formatBRL(metrics.economiaMedia)}
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="group/card relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5 transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20 sm:col-span-2 lg:col-span-1">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover/card:bg-blue-500/20" />
            
            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/20 p-1.5">
                  <TrendingUp size={16} className="text-blue-400" />
                </div>
                <div className="text-xs font-medium text-slate-300">Taxa de Sucesso</div>
              </div>
              
              <div className="mb-2 flex items-baseline gap-2">
                <div className="text-3xl font-bold tabular-nums text-blue-300">
                  {metrics.mesesComEconomia}
                </div>
                <div className="text-lg font-medium text-slate-400">
                  / {metrics.totalMeses}
                </div>
              </div>
              
              <div className="mb-3 text-xs text-slate-400">meses com economia</div>
              
              {/* Barra de progresso */}
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-700/50">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                  style={{ width: `${metrics.percentualMesesComEconomia}%` }}
                />
              </div>
              <div className="mt-2 text-right text-xs font-bold text-blue-300">
                {metrics.percentualMesesComEconomia.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
