'use client'

import { formatBRL } from '@/lib/format'
import type { BreakdownItem } from '@/lib/calculators/types'

export function ResultBreakdown({
  title,
  totalLabel,
  total,
  items,
}: {
  title: string
  totalLabel: string
  total: number
  items: BreakdownItem[]
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-slate-400">Valores estimados. Ajuste os percentuais para ficar mais próximo do seu caso.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">{totalLabel}</div>
          <div className="text-lg font-semibold text-slate-50">{formatBRL(total)}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((it) => {
          const sign = it.kind === 'deduction' ? '-' : it.kind === 'earning' ? '+' : ''
          const color =
            it.kind === 'deduction' ? 'text-rose-200' : it.kind === 'earning' ? 'text-emerald-200' : 'text-slate-300'

          return (
            <div key={it.key} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2">
              <div className="text-sm text-slate-100">{it.label}</div>
              <div className={['text-sm tabular-nums', color].join(' ')}>
                {it.kind === 'info' ? '' : sign} {formatBRL(it.amount)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

