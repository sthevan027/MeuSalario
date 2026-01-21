'use client'

import { useState, useMemo } from 'react'
import { formatBRL } from '@/lib/format'
import { DeleteSimulationButton } from '@/components/simulations/DeleteSimulationButton'
import { HistoryFilters } from '@/components/historico/HistoryFilters'

type SimulationRow = {
  id: string
  contract_type: 'clt' | 'pj'
  input_json: any
  result_json: any
  created_at: string
}

type FilterState = {
  contractType: 'all' | 'clt' | 'pj'
  kind: 'all' | 'monthly' | 'termination' | 'compare' | 'thirteenth' | 'vacation'
  minValue?: number
  maxValue?: number
  startDate?: string
  endDate?: string
}

function getKind(row: SimulationRow) {
  return String(row.input_json?.kind ?? 'monthly')
}

function getValue(row: SimulationRow) {
  const kind = getKind(row)
  if (kind === 'termination') return Number(row.result_json?.total ?? 0)
  if (kind === 'thirteenth') return Number(row.result_json?.totalLiquido ?? 0)
  if (kind === 'vacation') return Number(row.result_json?.totalLiquido ?? 0)
  return Number(row.result_json?.liquido ?? 0)
}

function getLabel(row: SimulationRow) {
  const kind = getKind(row)
  if (kind === 'termination') return 'Rescisão'
  if (kind === 'compare') return `Comparador (${row.contract_type.toUpperCase()})`
  if (kind === 'thirteenth') return '13º Salário'
  if (kind === 'vacation') return 'Férias'
  return `Mensal (${row.contract_type.toUpperCase()})`
}

export function HistoryTable({ rows }: { rows: SimulationRow[] }) {
  const [filters, setFilters] = useState<FilterState>({
    contractType: 'all',
    kind: 'all',
  })

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Filtro por tipo de contrato
      if (filters.contractType !== 'all' && r.contract_type !== filters.contractType) {
        return false
      }

      // Filtro por tipo de simulação
      const kind = getKind(r)
      if (filters.kind !== 'all' && kind !== filters.kind) {
        return false
      }

      // Filtro por valor
      const value = getValue(r)
      if (filters.minValue !== undefined && value < filters.minValue) {
        return false
      }
      if (filters.maxValue !== undefined && value > filters.maxValue) {
        return false
      }

      // Filtro por data
      const createdDate = new Date(r.created_at)
      if (filters.startDate) {
        const start = new Date(filters.startDate)
        if (createdDate < start) return false
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999) // Inclui o dia inteiro
        if (createdDate > end) return false
      }

      return true
    })
  }, [rows, filters])

  return (
    <div className="space-y-6">
      <HistoryFilters onFilterChange={setFilters} />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-4 gap-3 border-b border-white/10 px-4 py-3 text-xs font-medium text-slate-300">
          <div>Tipo</div>
          <div>Data</div>
          <div className="text-right">Valor</div>
          <div className="text-right">Ações</div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">
            {rows.length > 0
              ? 'Nenhuma simulação encontrada com os filtros aplicados.'
              : 'Você ainda não salvou nenhuma simulação.'}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredRows.map((r) => (
              <div key={r.id} className="grid grid-cols-4 gap-3 px-4 py-3 text-sm">
                <div className="text-slate-100">{getLabel(r)}</div>
                <div className="text-slate-300">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
                <div className="text-right font-medium tabular-nums text-slate-50">{formatBRL(getValue(r))}</div>
                <div className="flex items-center justify-end">
                  <DeleteSimulationButton simulationId={r.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
