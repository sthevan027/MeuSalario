'use client'

import { Sparkles } from 'lucide-react'

type Props = {
  remaining: number
  urgent?: boolean
}

export function SimulationQuotaBanner({ remaining, urgent }: Props) {
  return (
    <div
      className={`sticky top-0 z-30 border-b px-4 py-2.5 text-center text-sm backdrop-blur-md sm:text-left ${
        urgent
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
          : 'border-white/10 bg-slate-900/80 text-slate-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <span>
            Simulações restantes:{' '}
            <strong className="font-semibold text-white">{remaining}</strong>
          </span>
        </span>
        {urgent ? (
          <span className="text-xs font-medium text-amber-200/90">Últimas simulações do plano FREE</span>
        ) : null}
      </div>
    </div>
  )
}
