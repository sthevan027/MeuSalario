'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const periods = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: 'all', label: 'Todos' },
]

export function PeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = searchParams.get('period') || '30'

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handlePeriodChange(period.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${
            currentPeriod === period.value
              ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
