'use client'

import { memo } from 'react'
import {
  ResponsiveContainer,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { formatBRL } from '@/lib/format'

export type ForecastPoint = {
  month: string
  value: number
  mes: number
  ano: number
}

type Props = {
  data: ForecastPoint[]
  tendencia: number
}

export const AnnualForecastChart = memo(function AnnualForecastChart({ data, tendencia }: Props) {
  const formatCompactBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ value?: number }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      if (typeof value === 'number') {
        return (
          <div className="rounded-2xl border-2 border-white/25 bg-gradient-to-br from-slate-900/98 to-slate-800/98 px-5 py-3 shadow-2xl backdrop-blur-md">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-purple-300">{formatBRL(value)}</p>
            <p className="mt-2 text-xs text-slate-400">
              {tendencia < 0 ? '↘' : '↗'} Projeção baseada na tendência
            </p>
          </div>
        )
      }
    }
    return null
  }

  // Calcula média para linha de referência
  const media = data.reduce((sum, d) => sum + d.value, 0) / data.length

  return (
    <div className="h-80 w-full sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 12, right: 20, top: 20, bottom: 12 }}>
          <defs>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(168,85,247,0.8)" />
              <stop offset="50%" stopColor="rgba(168,85,247,0.5)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0.2)" />
            </linearGradient>
            <linearGradient id="forecastLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(139,92,246,1)" />
              <stop offset="100%" stopColor="rgba(196,181,253,1)" />
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

          {/* Linha de referência da média */}
          <ReferenceLine
            y={media}
            stroke="rgba(168,85,247,0.5)"
            strokeDasharray="6 4"
            strokeWidth={2}
            ifOverflow="extendDomain"
            label={{
              value: `Média: ${formatCompactBRL(media)}`,
              position: 'insideTopRight',
              fill: 'rgba(168,85,247,0.9)',
              fontSize: 11,
              fontWeight: 600,
              offset: 10,
            }}
          />

          {/* Barras de previsão */}
          <Bar
            dataKey="value"
            fill="url(#forecastGradient)"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
            animationDuration={1000}
          />

          {/* Linha conectando os valores */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#forecastLineGradient)"
            strokeWidth={3}
            dot={{ r: 5, fill: 'rgba(168,85,247,1)', strokeWidth: 2, stroke: 'rgba(255,255,255,0.8)' }}
            activeDot={{ r: 7, strokeWidth: 3 }}
            isAnimationActive={true}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
