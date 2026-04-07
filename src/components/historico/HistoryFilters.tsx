'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'

type FilterState = {
  contractType: 'all' | 'clt' | 'pj'
  kind: 'all' | 'monthly' | 'termination' | 'compare' | 'thirteenth' | 'vacation'
  minValue?: number
  maxValue?: number
  startDate?: string
  endDate?: string
}

export function HistoryFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: FilterState) => void
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    contractType: 'all',
    kind: 'all',
  })

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const cleared = {
      contractType: 'all' as const,
      kind: 'all' as const,
    }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  const hasActiveFilters = filters.contractType !== 'all' || filters.kind !== 'all' || filters.minValue || filters.maxValue || filters.startDate || filters.endDate

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          <Filter size={16} />
          Filtros
          {hasActiveFilters && (
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Ativo
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">Tipo de Contrato</label>
              <select
                value={filters.contractType}
                onChange={(e) =>
                  handleFilterChange('contractType', e.target.value as FilterState['contractType'])
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60"
              >
                <option value="all">Todos</option>
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">Tipo de Simulação</label>
              <select
                value={filters.kind}
                onChange={(e) => handleFilterChange('kind', e.target.value as FilterState['kind'])}
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60"
              >
                <option value="all">Todas</option>
                <option value="monthly">Mensal</option>
                <option value="termination">Rescisão</option>
                <option value="compare">Comparador</option>
                <option value="thirteenth">13º Salário</option>
                <option value="vacation">Férias</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">Valor Mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.minValue || ''}
                onChange={(e) => handleFilterChange('minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0,00"
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">Valor Máximo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.maxValue || ''}
                onChange={(e) => handleFilterChange('maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Sem limite"
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">Data Inicial</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">Data Final</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
