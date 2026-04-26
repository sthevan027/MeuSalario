'use client'

import { Sparkles } from 'lucide-react'
import { isQuotaResetDue } from '@/lib/simulation-quota'

type Props = {
  simulations: number
  comparisons: number
  compatibility: number
  urgent?: boolean
  quotaResetAt: string | null
}

function formatResetDate(resetAt: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(
      new Date(resetAt)
    )
  } catch {
    return resetAt
  }
}

export function SimulationQuotaBanner({
  simulations,
  comparisons,
  compatibility,
  urgent,
  quotaResetAt,
}: Props) {
  const resetDue = isQuotaResetDue(quotaResetAt)
  const allExhausted = simulations <= 0 && comparisons <= 0 && compatibility <= 0

  return (
    <div
      className={`sticky top-0 z-30 border-b px-4 py-2.5 text-center text-xs backdrop-blur-md sm:text-left sm:text-sm ${
        urgent
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
          : 'border-white/10 bg-slate-900/80 text-slate-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <span className="font-medium text-slate-300">
            {resetDue && allExhausted ? 'Plano FREE — quotas renovadas:' : 'Plano FREE — restantes:'}
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 tabular-nums sm:justify-end">
          <span>
            <strong className="text-white">{resetDue && allExhausted ? '5' : simulations}</strong> simulações
          </span>
          <span className="text-slate-500" aria-hidden>
            ·
          </span>
          <span>
            <strong className="text-white">{resetDue && allExhausted ? '2' : comparisons}</strong> comparações
          </span>
          <span className="text-slate-500" aria-hidden>
            ·
          </span>
          <span>
            <strong className="text-white">{resetDue && allExhausted ? '2' : compatibility}</strong> compatibilidade
          </span>
        </span>
        {urgent ? (
          <span className="text-center text-[11px] font-medium text-amber-200/90 sm:w-full sm:text-left">
            Algum limite está baixo — considere o Pro (ilimitado).
          </span>
        ) : quotaResetAt && !resetDue ? (
          <span className="text-center text-[11px] text-slate-500 sm:w-full sm:text-left">
            Renova em {formatResetDate(quotaResetAt)} · Pro é ilimitado.
          </span>
        ) : null}
      </div>
    </div>
  )
}
