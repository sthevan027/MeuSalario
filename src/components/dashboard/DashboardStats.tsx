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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Média
          </div>
          <BarChart3 size={16} className="text-slate-500 sm:h-5 sm:w-5" />
        </div>
        <div className="text-lg font-bold tabular-nums text-slate-50 sm:text-xl">
          {formatBRL(stats.media)}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Mediana
          </div>
          <BarChart3 size={16} className="text-slate-500 sm:h-5 sm:w-5" />
        </div>
        <div className="text-lg font-bold tabular-nums text-slate-50 sm:text-xl">
          {formatBRL(stats.mediana)}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Maior
          </div>
          <TrendingUp size={16} className="text-emerald-400 sm:h-5 sm:w-5" />
        </div>
        <div className="text-lg font-bold tabular-nums text-emerald-300 sm:text-xl">
          {formatBRL(stats.maior)}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Menor
          </div>
          <TrendingDown size={16} className="text-rose-400 sm:h-5 sm:w-5" />
        </div>
        <div className="text-lg font-bold tabular-nums text-rose-300 sm:text-xl">
          {formatBRL(stats.menor)}
        </div>
      </div>
    </div>
  )
}
