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
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:rounded-2xl sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
          <p className="text-[10px] text-slate-400 sm:text-xs">Valores estimados. Ajuste os percentuais para ficar mais próximo do seu caso.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 sm:text-xs">{totalLabel}</div>
          <div className="text-base font-semibold text-slate-50 sm:text-lg">{formatBRL(total)}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
        {items.map((it) => {
          const sign = it.kind === 'deduction' ? '-' : it.kind === 'earning' ? '+' : ''
          const color =
            it.kind === 'deduction' ? 'text-rose-200' : it.kind === 'earning' ? 'text-emerald-200' : 'text-slate-300'

          return (
            <div key={it.key} className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-2.5 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
              <div className="text-xs text-slate-100 sm:text-sm">{it.label}</div>
              <div className={['text-xs tabular-nums sm:text-sm', color].join(' ')}>
                {it.kind === 'info' ? '' : sign} {formatBRL(it.amount)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

