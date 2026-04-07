'use client'

import { memo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatBRL } from '@/lib/format'

export type DeductionPoint = {
  month: string
  inss: number | null
  irrf: number | null
  total: number | null
}

export const DeductionsChart = memo(function DeductionsChart({ data }: { data: DeductionPoint[] }) {
  const formatCompactBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)

  type PayloadEntry = { value?: number; name?: string; color?: string }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: PayloadEntry[]
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border-2 border-white/25 bg-gradient-to-br from-slate-900/98 to-slate-800/98 px-5 py-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          {payload.map((entry, index: number) => {
            if (typeof entry.value !== 'number') return null
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-300">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold text-slate-100">{formatBRL(entry.value)}</span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80 w-full sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 12, right: 20, top: 20, bottom: 12 }}>
          <defs>
            <linearGradient id="inssGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(239,68,68,1)" />
              <stop offset="100%" stopColor="rgba(248,113,113,1)" />
            </linearGradient>
            <linearGradient id="irrfGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(251,146,60,1)" />
              <stop offset="100%" stopColor="rgba(253,186,116,1)" />
            </linearGradient>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(220,38,38,1)" />
              <stop offset="100%" stopColor="rgba(239,68,68,1)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(255,255,255,0.12)"
            vertical={false}
            strokeWidth={0.5}
          />

          <XAxis
            dataKey="month"
            stroke="rgba(255,255,255,0.6)"
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            tickMargin={14}
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)', fontWeight: 500 }}
            dy={6}
          />

          <YAxis
            stroke="rgba(255,255,255,0.6)"
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            tickFormatter={(v) => formatCompactBRL(Number(v))}
            width={85}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)', fontWeight: 500 }}
            dx={-6}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span className="text-xs text-slate-300">{value}</span>
            )}
          />

          <Line
            type="monotone"
            dataKey="inss"
            name="INSS"
            stroke="url(#inssGradient)"
            strokeWidth={2.5}
            connectNulls={false}
            dot={{ r: 4, fill: 'rgba(239,68,68,1)' }}
            activeDot={{ r: 6 }}
          />

          <Line
            type="monotone"
            dataKey="irrf"
            name="IRRF"
            stroke="url(#irrfGradient)"
            strokeWidth={2.5}
            connectNulls={false}
            dot={{ r: 4, fill: 'rgba(251,146,60,1)' }}
            activeDot={{ r: 6 }}
          />

          <Line
            type="monotone"
            dataKey="total"
            name="Total Descontos"
            stroke="url(#totalGradient)"
            strokeWidth={3}
            connectNulls={false}
            dot={{ r: 5, fill: 'rgba(220,38,38,1)' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
