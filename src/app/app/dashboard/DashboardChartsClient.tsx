'use client'

import dynamic from 'next/dynamic'
import type { MonthlyNetPoint } from '@/components/charts/MonthlyNetChart'
import type { CltVsPjPoint } from '@/components/charts/CltVsPjChart'

const MonthlyNetChart = dynamic(
  () => import('@/components/charts/MonthlyNetChart').then((mod) => ({ default: mod.MonthlyNetChart })),
  { ssr: false }
)

const CltVsPjChart = dynamic(
  () => import('@/components/charts/CltVsPjChart').then((mod) => ({ default: mod.CltVsPjChart })),
  { ssr: false }
)

export function MonthlyNetChartClient({ data }: { data: MonthlyNetPoint[] }) {
  return <MonthlyNetChart data={data} />
}

export function CltVsPjChartClient({ data }: { data: CltVsPjPoint[] }) {
  return <CltVsPjChart data={data} />
}

