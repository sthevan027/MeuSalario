'use client'

import { memo, useMemo } from 'react'
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

export type CltVsPjPoint = {
  month: string
  clt: number | null
  pj: number | null
  difference: number | null
}

export const CltVsPjChart = memo(function CltVsPjChart({ data }: { data: CltVsPjPoint[] }) {
  const formatCompactBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cltValue = payload.find((p: any) => p.dataKey === 'clt')?.value
      const pjValue = payload.find((p: any) => p.dataKey === 'pj')?.value
      const diffValue = payload.find((p: any) => p.dataKey === 'difference')?.value

      return (
        <div className="rounded-2xl border-2 border-white/25 bg-gradient-to-br from-slate-900/98 to-slate-800/98 px-5 py-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          {typeof cltValue === 'number' && (
            <div className="mb-1 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-300">CLT:</span>
              </div>
              <span className="text-sm font-bold text-blue-400">{formatBRL(cltValue)}</span>
            </div>
          )}
          {typeof pjValue === 'number' && (
            <div className="mb-1 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-xs text-slate-300">PJ:</span>
              </div>
              <span className="text-sm font-bold text-purple-400">{formatBRL(pjValue)}</span>
            </div>
          )}
          {typeof diffValue === 'number' && (
            <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/10 pt-2">
              <span className="text-xs text-slate-300">Diferença (PJ - CLT):</span>
              <span className={`text-sm font-bold ${diffValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diffValue >= 0 ? '+' : ''}{formatBRL(diffValue)}
              </span>
            </div>
          )}
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
            <linearGradient id="cltGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(59,130,246,1)" />
              <stop offset="100%" stopColor="rgba(96,165,250,1)" />
            </linearGradient>
            <linearGradient id="pjGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(168,85,247,1)" />
              <stop offset="100%" stopColor="rgba(192,132,252,1)" />
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
            dataKey="clt"
            name="CLT"
            stroke="url(#cltGradient)"
            strokeWidth={3}
            connectNulls={false}
            dot={{ r: 5, fill: 'rgba(59,130,246,1)' }}
            activeDot={{ r: 7 }}
          />

          <Line
            type="monotone"
            dataKey="pj"
            name="PJ"
            stroke="url(#pjGradient)"
            strokeWidth={3}
            connectNulls={false}
            dot={{ r: 5, fill: 'rgba(168,85,247,1)' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
