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
  isCurrent?: boolean
  isForecast?: boolean
  forecastValue?: number
}

export function MonthlyNetChart({ data }: { data: MonthlyNetPoint[] }) {
  const nonNull = data.filter((d) => typeof d.liquido === 'number') as Array<{
    month: string
    liquido: number
  }>

  const avg =
    nonNull.length > 0 ? nonNull.reduce((acc, d) => acc + d.liquido, 0) / nonNull.length : null

  const min = nonNull.length > 0 ? Math.min(...nonNull.map((d) => d.liquido)) : null
  const max = nonNull.length > 0 ? Math.max(...nonNull.map((d) => d.liquido)) : null

  // Calcula previsão para o próximo mês usando regressão linear simples
  const calculateForecast = (): number | null => {
    if (nonNull.length < 2) return null
    
    // Usa os últimos 3-6 meses para calcular tendência
    const recentData = nonNull.slice(-6)
    if (recentData.length < 2) return null

    // Regressão linear simples
    const n = recentData.length
    const sumX = recentData.reduce((acc, _, i) => acc + i, 0)
    const sumY = recentData.reduce((acc, d) => acc + d.liquido, 0)
    const sumXY = recentData.reduce((acc, d, i) => acc + i * d.liquido, 0)
    const sumX2 = recentData.reduce((acc, _, i) => acc + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Previsão para o próximo ponto (n)
    const forecast = slope * n + intercept
    return Math.max(0, forecast) // Não permite valores negativos
  }

  const forecastValue = calculateForecast()

  // Encontra o índice do mês atual
  const currentMonthIndex = data.findIndex((d) => d.isCurrent)
  const currentMonth = currentMonthIndex >= 0 ? data[currentMonthIndex]?.month : null

  // Adiciona previsão aos dados se houver
  const dataWithForecast = [...data]
  if (forecastValue !== null && data.length > 0 && nonNull.length > 0) {
    const lastMonth = data[data.length - 1].month
    // Extrai mês e ano do último mês e adiciona 1
    const [monthStr, yearStr] = lastMonth.split('/')
    const month = parseInt(monthStr)
    const year = parseInt(yearStr)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const nextMonthLabel = `${String(nextMonth).padStart(2, '0')}/${nextYear}`

    // Verifica se já não existe
    if (!dataWithForecast.some((d) => d.month === nextMonthLabel)) {
      // Encontra o último valor histórico para conectar a linha
      const lastHistoricalValue = nonNull[nonNull.length - 1].liquido
      const lastHistoricalMonth = data.find((d) => d.liquido === lastHistoricalValue)?.month || lastMonth
      
      // Adiciona o ponto de previsão
      dataWithForecast.push({
        month: nextMonthLabel,
        liquido: null,
        isForecast: true,
        forecastValue,
      })
    }
  }

  const formatCompactBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)

  // Calcula o domínio do YAxis com padding para melhor visualização
  const getYAxisDomain = () => {
    let actualMax = max
    if (forecastValue !== null && (actualMax === null || forecastValue > actualMax)) {
      actualMax = forecastValue
    }
    
    if (!min || !actualMax) return ['auto', 'auto']
    const range = actualMax - min
    const padding = Math.max(range * 0.1, 100) // 10% de padding ou mínimo de R$ 100
    return [Math.max(0, min - padding), actualMax + padding]
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      const value = payload[0].value
      const isForecast = dataPoint?.isForecast
      const forecastValue = dataPoint?.forecastValue

      if (typeof value === 'number' || (isForecast && typeof forecastValue === 'number')) {
        const displayValue = typeof value === 'number' ? value : forecastValue
        return (
          <div className="rounded-xl border border-white/20 bg-slate-900/95 px-4 py-2.5 shadow-xl backdrop-blur-sm">
            <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
            {isForecast ? (
              <>
                <p className="text-lg font-bold text-amber-400">
                  {formatBRL(displayValue)}
                  <span className="ml-2 text-xs font-normal text-amber-300">(Previsão)</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Baseado na tendência dos últimos meses
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-emerald-400">{formatBRL(displayValue)}</p>
                {typeof avg === 'number' && (
                  <p className="mt-1 text-xs text-slate-500">
                    Diferença da média: {displayValue >= avg ? '+' : ''}
                    {formatBRL(displayValue - avg)}
                  </p>
                )}
              </>
            )}
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataWithForecast} margin={{ left: 8, right: 16, top: 12, bottom: 8 }}>
          <defs>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.25)" />
              <stop offset="50%" stopColor="rgba(16,185,129,0.1)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0)" />
            </linearGradient>
            <linearGradient id="netLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(16,185,129,0.95)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.95)" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 5" stroke="rgba(255,255,255,0.08)" vertical={false} />
          
          <XAxis
            dataKey="month"
            stroke="rgba(255,255,255,0.5)"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            interval="preserveStartEnd"
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
            dy={4}
          />
          
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompactBRL(Number(v))}
            width={80}
            domain={getYAxisDomain()}
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
            dx={-4}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Linha vertical tracejada branca indicando mês atual */}
          {currentMonth && (
            <ReferenceLine
              x={currentMonth}
              stroke="rgba(255,255,255,0.5)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
            />
          )}

          {typeof avg === 'number' && (
            <ReferenceLine
              y={avg}
              stroke="rgba(16,185,129,0.4)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={{
                value: `Média: ${formatCompactBRL(avg)}`,
                position: 'insideTopRight',
                fill: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                fontWeight: 500,
                offset: 8,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="liquido"
            stroke="none"
            fill="url(#netFill)"
            isAnimationActive={true}
            animationDuration={800}
            animationBegin={0}
            connectNulls={false}
          />
          
          {/* Linha principal de dados históricos */}
          <Line
            type="monotone"
            dataKey="liquido"
            stroke="url(#netLineGradient)"
            strokeWidth={2.5}
            connectNulls={false}
            isAnimationActive={true}
            animationDuration={800}
            animationBegin={0}
            dot={(props: any) => {
              const value = props?.payload?.liquido
              const isForecast = props?.payload?.isForecast
              if (typeof value !== 'number' && !isForecast) return false

              const onlyOnePoint = nonNull.length === 1
              const r = onlyOnePoint ? 5.5 : 4
              const fillColor = isForecast ? 'rgba(251,191,36,1)' : 'rgba(16,185,129,1)'
              const strokeColor = isForecast ? 'rgba(2,6,23,0.95)' : 'rgba(2,6,23,0.95)'
              
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={r}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  className="transition-all duration-200 hover:r-6"
                />
              )
            }}
            activeDot={{
              r: 7,
              strokeWidth: 2.5,
              stroke: 'rgba(2,6,23,0.95)',
              fill: 'rgba(16,185,129,1)',
              className: 'drop-shadow-lg',
            }}
          />

          {/* Linha tracejada para previsão - conecta último ponto histórico com previsão */}
          {forecastValue !== null && nonNull.length > 0 && (
            <Line
              type="monotone"
              dataKey={(entry: any) => {
                if (entry.isForecast) return entry.forecastValue
                // Retorna o último valor histórico para conectar com a previsão
                const lastHistoricalValue = nonNull[nonNull.length - 1].liquido
                const lastHistoricalMonth = data.find((d) => d.liquido === lastHistoricalValue)?.month
                if (entry.month === lastHistoricalMonth) return entry.liquido
                return null
              }}
              stroke="rgba(251,191,36,0.65)"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              connectNulls={true}
              isAnimationActive={false}
              dot={(props: any) => {
                const isForecast = props?.payload?.isForecast
                if (!isForecast) return false
                
                const value = props?.payload?.forecastValue
                if (typeof value !== 'number') return false
                
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={5.5}
                    fill="rgba(251,191,36,1)"
                    stroke="rgba(2,6,23,0.95)"
                    strokeWidth={2.5}
                    className="transition-all duration-200 hover:r-7"
                  />
                )
              }}
              activeDot={{
                r: 7,
                strokeWidth: 2.5,
                stroke: 'rgba(2,6,23,0.95)',
                fill: 'rgba(251,191,36,1)',
                className: 'drop-shadow-lg',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

