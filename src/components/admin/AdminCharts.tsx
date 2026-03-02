'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

type UserGrowthData = {
  date: string
  total: number
  pro: number
}

type PlanDistributionData = {
  name: string
  value: number
  color: string
}

type AdminChartsProps = {
  userGrowthData: UserGrowthData[]
  planDistribution: PlanDistributionData[]
}

export function AdminCharts({ userGrowthData, planDistribution }: AdminChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UserGrowthChart data={userGrowthData} />
      <PlanDistributionChart data={planDistribution} />
    </div>
  )
}

function UserGrowthChart({ data }: { data: UserGrowthData[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-4 backdrop-blur-sm sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-300 sm:text-base">
        Crescimento de Usuários
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="pro"
              name="Pro"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPro)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-400">Total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-400">Pro</span>
        </div>
      </div>
    </div>
  )
}

function PlanDistributionChart({ data }: { data: PlanDistributionData[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-4 backdrop-blur-sm sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-300 sm:text-base">
        Distribuição de Planos
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f1f5f9',
              }}
              itemStyle={{ color: '#f1f5f9' }}
              formatter={(value, name) => {
                const total = data.reduce((acc, item) => acc + item.value, 0)
                const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(0) : 0
                return [`${value} usuários (${percent}%)`, name]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div 
              className="h-2.5 w-2.5 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-400">{item.name}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
