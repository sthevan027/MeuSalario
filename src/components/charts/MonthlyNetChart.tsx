'use client'

// Polyfill para Node.js
if (typeof self === 'undefined') {
  (globalThis as any).self = globalThis
}

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ReferenceLine,
} from 'recharts'
import { formatBRL } from '@/lib/format'

export type MonthlyNetPoint = {
  month: string
  liquido: number | null
}

export function MonthlyNetChart({ data }: { data: MonthlyNetPoint[] }) {
  const nonNull = data.filter((d) => typeof d.liquido === 'number') as Array<{
    month: string
    liquido: number
  }>

  const avg =
    nonNull.length > 0 ? nonNull.reduce((acc, d) => acc + d.liquido, 0) / nonNull.length : null

  const formatCompactBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 6, right: 14, top: 8, bottom: 6 }}>
          <defs>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(56,189,248,0.35)" />
              <stop offset="70%" stopColor="rgba(56,189,248,0.08)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0)" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,0.07)" />
          <XAxis
            dataKey="month"
            stroke="rgba(255,255,255,0.55)"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="rgba(255,255,255,0.55)"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompactBRL(Number(v))}
            width={72}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(v) => formatBRL(Number(v))}
            contentStyle={{
              background: 'rgba(2,6,23,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
            separator=": "
          />

          {typeof avg === 'number' && (
            <ReferenceLine
              y={avg}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="6 6"
              ifOverflow="extendDomain"
              label={{
                value: `Média: ${formatCompactBRL(avg)}`,
                position: 'insideTopRight',
                fill: 'rgba(255,255,255,0.55)',
                fontSize: 12,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="liquido"
            stroke="none"
            fill="url(#netFill)"
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="liquido"
            stroke="rgba(56,189,248,0.95)"
            strokeWidth={2}
            connectNulls={false}
            dot={(props: any) => {
              const value = props?.payload?.liquido
              if (typeof value !== 'number') return false

              // Quando só existe 1 ponto no período, desenha um dot maior pra não parecer “bugado”.
              const onlyOnePoint = nonNull.length === 1
              const r = onlyOnePoint ? 5 : 3
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={r}
                  fill="rgba(56,189,248,1)"
                  stroke="rgba(2,6,23,0.9)"
                  strokeWidth={2}
                />
              )
            }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'rgba(2,6,23,0.9)', fill: 'rgba(56,189,248,1)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

