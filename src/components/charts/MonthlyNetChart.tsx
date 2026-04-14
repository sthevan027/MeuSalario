'use client'

// Polyfill para Node.js
if (typeof globalThis.self === 'undefined') {
  Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true })
}

import { memo } from 'react'
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

export const MonthlyNetChart = memo(function MonthlyNetChart({ data }: { data: MonthlyNetPoint[] }) {
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

  // Calcula o domínio do YAxis baseado na média com margem de R$ 2.000 acima e abaixo
  const getYAxisDomain = () => {
    if (!avg || typeof avg !== 'number') {
      // Fallback: usar min/max se não tiver média
      let actualMax = max
      if (forecastValue !== null && (actualMax === null || forecastValue > actualMax)) {
        actualMax = forecastValue
      }
      
      if (!min || !actualMax) return ['auto', 'auto']
      const range = actualMax - min
      const padding = Math.max(range * 0.1, 100)
      return [Math.max(0, min - padding), actualMax + padding]
    }
    
    // Usar média como centro com margem de R$ 2.000 acima e abaixo
    const margin = 2000
    const yMin = Math.max(0, avg - margin)
    const yMax = avg + margin
    
    return [yMin, yMax]
  }

  // Calcula ticks do YAxis para evitar duplicatas
  const getYAxisTicks = (): number[] | undefined => {
    const [yMin, yMax] = getYAxisDomain()
    if (yMin === 'auto' || yMax === 'auto' || !min || !max) return undefined
    
    const minVal = typeof yMin === 'number' ? yMin : 0
    const maxVal = typeof yMax === 'number' ? yMax : 0
    const range = maxVal - minVal
    
    if (range === 0) return undefined
    
    // Determina o intervalo ideal baseado no range e altura do gráfico
    // Tentamos manter entre 4-8 ticks
    const targetTicks = 6
    const rawInterval = range / targetTicks
    
    // Arredonda para intervalos "bonitos" (500, 1000, 2000, 5000, 10000)
    let interval = 1000
    if (rawInterval <= 300) {
      interval = 250
    } else if (rawInterval <= 600) {
      interval = 500
    } else if (rawInterval <= 1500) {
      interval = 1000
    } else if (rawInterval <= 3000) {
      interval = 2000
    } else if (rawInterval <= 7000) {
      interval = 5000
    } else {
      interval = 10000
    }
    
    // Arredonda minVal para baixo e maxVal para cima no intervalo
    const startTick = Math.max(0, Math.floor(minVal / interval) * interval)
    const endTick = Math.ceil(maxVal / interval) * interval
    
    // Gera ticks e remove duplicatas baseado no valor formatado
    const ticks: number[] = []
    const seenFormatted = new Set<string>()
    
    for (let tick = startTick; tick <= endTick + interval; tick += interval) {
      if (tick < minVal - range * 0.05 || tick > maxVal + range * 0.05) continue
      
      const formatted = formatCompactBRL(tick)
      if (!seenFormatted.has(formatted)) {
        seenFormatted.add(formatted)
        ticks.push(tick)
      }
    }
    
    return ticks.length > 1 ? ticks : undefined
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{
      value?: number
      payload?: MonthlyNetPoint
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      const value = payload[0].value
      const isForecast = dataPoint?.isForecast
      const forecastValue = dataPoint?.forecastValue

      if (typeof value === 'number' || (isForecast && typeof forecastValue === 'number')) {
        const displayValue: number = typeof value === 'number' ? value : (forecastValue as number)
        return (
          <div className="rounded-2xl border-2 border-white/25 bg-gradient-to-br from-slate-900/98 to-slate-800/98 px-5 py-3 shadow-2xl backdrop-blur-md">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            {isForecast ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-amber-400">
                    {formatBRL(displayValue)}
                  </p>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                    Previsão
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  📈 Baseado na tendência recente
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-emerald-400">{formatBRL(displayValue)}</p>
                {typeof avg === 'number' && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`text-xs font-semibold ${displayValue >= avg ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {displayValue >= avg ? '↗' : '↘'} {displayValue >= avg ? '+' : ''}
                      {formatBRL(displayValue - avg)}
                    </div>
                    <span className="text-xs text-slate-500">da média</span>
                  </div>
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
    <div className="h-80 w-full sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataWithForecast} margin={{ left: 12, right: 20, top: 20, bottom: 12 }}>
          <defs>
            {/* Gradiente de preenchimento mais vibrante */}
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.4)" />
              <stop offset="40%" stopColor="rgba(16,185,129,0.2)" />
              <stop offset="80%" stopColor="rgba(16,185,129,0.05)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0)" />
            </linearGradient>
            
            {/* Gradiente da linha principal com cores mais vivas */}
            <linearGradient id="netLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(5,150,105,1)" />
              <stop offset="50%" stopColor="rgba(16,185,129,1)" />
              <stop offset="100%" stopColor="rgba(52,211,153,1)" />
            </linearGradient>
            
            {/* Gradiente amarelo para previsão */}
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(245,158,11,1)" />
              <stop offset="100%" stopColor="rgba(251,191,36,1)" />
            </linearGradient>

            {/* Filtro de brilho/glow para os pontos */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
            domain={getYAxisDomain()}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)', fontWeight: 500 }}
            dx={-6}
            ticks={getYAxisTicks()}
            allowDecimals={false}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Linha vertical tracejada branca indicando mês atual */}
          {currentMonth && (
            <ReferenceLine
              x={currentMonth}
              stroke="rgba(255,255,255,0.6)"
              strokeDasharray="5 3"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={{
                value: 'HOJE',
                position: 'top',
                fill: 'rgba(255,255,255,0.8)',
                fontSize: 10,
                fontWeight: 700,
                offset: 12,
              }}
            />
          )}

          {typeof avg === 'number' && (
            <ReferenceLine
              y={avg}
              stroke="rgba(251,146,60,0.85)"
              strokeDasharray="6 4"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={{
                value: `Média prevista: ${formatCompactBRL(avg)}`,
                position: 'insideTopRight',
                fill: 'rgba(251,146,60,0.95)',
                fontSize: 12,
                fontWeight: 700,
                offset: 10,
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
            strokeWidth={3.5}
            connectNulls={false}
            isAnimationActive={true}
            animationDuration={1000}
            animationBegin={100}
            animationEasing="ease-in-out"
            dot={(props: { cx?: number; cy?: number; payload?: MonthlyNetPoint }) => {
              const value = props?.payload?.liquido
              const isForecast = props?.payload?.isForecast
              if (typeof value !== 'number' && !isForecast) return false

              const onlyOnePoint = nonNull.length === 1
              const r = onlyOnePoint ? 8 : 5.5
              
              return (
                <>
                  {/* Círculo de brilho externo */}
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={r + 4}
                    fill="rgba(16,185,129,0.2)"
                    stroke="none"
                  />
                  {/* Ponto principal */}
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={r}
                    fill="rgba(16,185,129,1)"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2.5}
                    filter="url(#glow)"
                  />
                </>
              )
            }}
            activeDot={{
              r: 9,
              strokeWidth: 3,
              stroke: 'rgba(255,255,255,1)',
              fill: 'rgba(16,185,129,1)',
              filter: 'url(#glow)',
            }}
          />

          {/* Linha tracejada para previsão - conecta último ponto histórico com previsão */}
          {forecastValue !== null && nonNull.length > 0 && (
            <Line
              type="monotone"
              dataKey={(entry: MonthlyNetPoint) => {
                if (entry.isForecast) return entry.forecastValue
                // Retorna o último valor histórico para conectar com a previsão
                const lastHistoricalValue = nonNull[nonNull.length - 1].liquido
                const lastHistoricalMonth = data.find((d) => d.liquido === lastHistoricalValue)?.month
                if (entry.month === lastHistoricalMonth) return entry.liquido
                return null
              }}
              stroke="url(#forecastGradient)"
              strokeWidth={3.5}
              strokeDasharray="10 6"
              connectNulls={true}
              isAnimationActive={true}
              animationDuration={800}
              animationBegin={400}
              dot={(props: { cx?: number; cy?: number; payload?: MonthlyNetPoint }) => {
                const isForecast = props?.payload?.isForecast
                if (!isForecast) return false
                
                const value = props?.payload?.forecastValue
                if (typeof value !== 'number') return false
                
                return (
                  <>
                    {/* Círculo de brilho externo amarelo */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={10}
                      fill="rgba(251,191,36,0.25)"
                      stroke="none"
                    />
                    {/* Ponto de previsão */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={6.5}
                      fill="rgba(251,191,36,1)"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2.5}
                      filter="url(#glow)"
                    />
                  </>
                )
              }}
              activeDot={{
                r: 9,
                strokeWidth: 3,
                stroke: 'rgba(255,255,255,1)',
                fill: 'rgba(251,191,36,1)',
                filter: 'url(#glow)',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

