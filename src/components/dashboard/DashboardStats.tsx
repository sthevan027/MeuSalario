'use client'

import { useMemo } from 'react'
import { formatBRL } from '@/lib/format'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

type SimulationData = {
  liquido: number
  created_at: Date | string
  contract_type: 'clt' | 'pj'
}

type Props = {
  simulations: SimulationData[]
}

export function DashboardStats({ simulations }: Props) {
  const stats = useMemo(() => {
    if (simulations.length === 0) {
      return null
    }

    const valores = simulations.map((s) => s.liquido).filter((v) => v > 0)
    
    if (valores.length === 0) {
      return null
    }

    // Ordena valores para calcular mediana
    const sorted = [...valores].sort((a, b) => a - b)
    
    // Média
    const media = valores.reduce((sum, v) => sum + v, 0) / valores.length
    
    // Mediana
    const mediana = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
    
    // Maior e menor
    const maior = Math.max(...valores)
    const menor = Math.min(...valores)
    
    // Tendência (comparando últimos 3 meses com anteriores)
    // Ordena por data para comparar corretamente
    const sortedByDate = [...simulations].sort((a, b) => {
      const dateA = typeof a.created_at === 'string' ? new Date(a.created_at) : a.created_at
      const dateB = typeof b.created_at === 'string' ? new Date(b.created_at) : b.created_at
      return dateA.getTime() - dateB.getTime()
    })
    
    let tendencia: 'up' | 'down' | 'stable' = 'stable'
    if (sortedByDate.length >= 6) {
      const recentes = sortedByDate.slice(-3).map((s) => s.liquido).filter((v) => v > 0)
      const anteriores = sortedByDate.slice(-6, -3).map((s) => s.liquido).filter((v) => v > 0)
      
      if (recentes.length > 0 && anteriores.length > 0) {
        const mediaRecentes = recentes.reduce((sum, v) => sum + v, 0) / recentes.length
        const mediaAnteriores = anteriores.reduce((sum, v) => sum + v, 0) / anteriores.length
        const diff = ((mediaRecentes - mediaAnteriores) / mediaAnteriores) * 100
        
        if (diff > 2) tendencia = 'up'
        else if (diff < -2) tendencia = 'down'
      }
    }

    return {
      media,
      mediana,
      maior,
      menor,
      tendencia,
      total: valores.length,
    }
  }, [simulations])

  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Média */}
      <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/20 p-1.5">
                <BarChart3 size={18} className="text-blue-400" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-300/90">
                Média
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-50 sm:text-3xl">
            {formatBRL(stats.media)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Baseado em {stats.total} {stats.total === 1 ? 'mês' : 'meses'}
          </div>
        </div>
      </div>

      {/* Mediana */}
      <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/20 p-1.5">
                <BarChart3 size={18} className="text-purple-400" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-purple-300/90">
                Mediana
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-50 sm:text-3xl">
            {formatBRL(stats.mediana)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Valor central dos dados
          </div>
        </div>
      </div>

      {/* Maior */}
      <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/20 p-1.5">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                Maior
              </div>
            </div>
            <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              PICO
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-300 sm:text-3xl">
            {formatBRL(stats.maior)}
          </div>
          <div className="mt-2 text-xs text-emerald-400/70">
            Melhor resultado registrado
          </div>
        </div>
      </div>

      {/* Menor */}
      <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/20">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/20 p-1.5">
                <TrendingDown size={18} className="text-amber-400" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">
                Menor
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-amber-300 sm:text-3xl">
            {formatBRL(stats.menor)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Base mínima registrada
          </div>
        </div>
      </div>
    </div>
  )
}
