'use client'

import dynamic from 'next/dynamic'
import { LazyChart } from '@/components/charts/LazyChart'

type MonthlyNetPoint = {
  month: string
  liquido: number | null
  isCurrent?: boolean
  isForecast?: boolean
  forecastValue?: number
}

type CltVsPjPoint = {
  month: string
  clt: number | null
  pj: number | null
  difference: number | null
}

const MonthlyNetChart = dynamic(
  () => import('@/components/charts/MonthlyNetChart').then((mod) => ({ default: mod.MonthlyNetChart })),
  { ssr: false }
)

const CltVsPjChart = dynamic(
  () => import('@/components/charts/CltVsPjChart').then((mod) => ({ default: mod.CltVsPjChart })),
  { ssr: false }
)

export function DashboardCharts({
  series,
  hasSeries,
  cltVsPjSeries,
  hasCltVsPjData,
}: {
  series: MonthlyNetPoint[]
  hasSeries: boolean
  cltVsPjSeries: CltVsPjPoint[]
  hasCltVsPjData: boolean
}) {
  if (!hasSeries && !hasCltVsPjData) return null

  return (
    <>
      {hasSeries ? (
        <div className="rounded-xl border border-white/10 bg-[#111]/90 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-100">Evolução do salário líquido</h2>
          <p className="mt-0.5 text-sm text-slate-500">Últimos 12 meses</p>
          <div className="mt-4">
            <LazyChart fallback="Carregando gráfico...">
              <MonthlyNetChart data={series} />
            </LazyChart>
          </div>
        </div>
      ) : null}

      {hasCltVsPjData ? (
        <div className="rounded-xl border border-white/10 bg-[#111]/90 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-100">CLT vs PJ</h2>
          <p className="mt-0.5 text-sm text-slate-500">Comparação ao longo do tempo</p>
          <div className="mt-4">
            <LazyChart fallback="Carregando gráfico...">
              <CltVsPjChart data={cltVsPjSeries} />
            </LazyChart>
          </div>
        </div>
      ) : null}
    </>
  )
}

