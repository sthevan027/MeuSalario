import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { Users, Crown, Activity, UserPlus, TrendingUp, DollarSign, Percent, type LucideIcon } from 'lucide-react'
import { AdminCharts } from '@/components/admin/AdminCharts'
import { PeriodFilter } from '@/components/admin/PeriodFilter'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

type SearchParams = { period?: string }

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-slate-100 backdrop-blur-sm">
        <div className="text-lg font-semibold">Falta configurar o Supabase Admin</div>
        <p className="mt-1 text-sm text-slate-300">
          Defina <code>SUPABASE_SERVICE_ROLE_KEY</code> no <code>.env.local</code> e reinicie o servidor.
        </p>
      </div>
    )
  }

  const period = searchParams.period || '30'
  const now = new Date()
  
  const getPeriodDate = (days: string) => {
    if (days === 'all') return new Date(0).toISOString()
    return new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString()
  }

  const periodDate = getPeriodDate(period)

  const [
    { count: totalUsers },
    { count: proUsers },
    { count: activeProUsers },
    { count: newUsersInPeriod },
    { count: freeUsers },
    { data: recentUsers },
    { data: allUsersData },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'pro')
      .in('subscription_status', ['active', 'trialing']),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', periodDate),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
    admin
      .from('profiles')
      .select('email, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('profiles')
      .select('created_at, plan')
      .order('created_at', { ascending: true }),
  ])

  const conversionRate = totalUsers && totalUsers > 0 
    ? ((proUsers ?? 0) / totalUsers * 100).toFixed(1) 
    : '0'

  const { data: plansData } = await admin
    .from('plans')
    .select('price_monthly')
    .eq('id', 'pro')
    .single()

  const monthlyRevenue = (activeProUsers ?? 0) * (plansData?.price_monthly ?? 0)

  const userGrowthData = generateGrowthData(allUsersData ?? [], period)
  
  const planDistribution = [
    { name: 'Free', value: freeUsers ?? 0, color: '#64748b' },
    { name: 'Pro', value: proUsers ?? 0, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">Visão geral das métricas da plataforma</p>
        </div>
        <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />}>
          <PeriodFilter />
        </Suspense>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total de usuários"
          labelMobile="Usuários"
          value={totalUsers ?? 0}
          subtitle="Todos os cadastros"
          subtitleMobile="Total"
          gradient="from-blue-500/10 to-cyan-500/5"
          iconColor="text-blue-400"
          labelColor="text-blue-300"
          hoverBorder="hover:border-blue-500/30"
        />

        <MetricCard
          icon={Crown}
          label="Usuários Pro"
          labelMobile="Pro"
          value={proUsers ?? 0}
          subtitle="Total com plano Pro"
          subtitleMobile="Total"
          gradient="from-amber-500/10 to-orange-500/5"
          iconColor="text-amber-400"
          labelColor="text-amber-300"
          hoverBorder="hover:border-amber-500/30"
        />

        <MetricCard
          icon={Activity}
          label="Pro ativos"
          labelMobile="Ativos"
          value={activeProUsers ?? 0}
          subtitle="Com assinatura ativa"
          subtitleMobile="Assinando"
          gradient="from-emerald-500/10 to-teal-500/5"
          iconColor="text-emerald-400"
          labelColor="text-emerald-300"
          hoverBorder="hover:border-emerald-500/30"
        />

        <MetricCard
          icon={UserPlus}
          label={`Novos (${period === 'all' ? 'todos' : period + 'd'})`}
          labelMobile="Novos"
          value={newUsersInPeriod ?? 0}
          subtitle={period === 'all' ? 'Todos os usuários' : `Últimos ${period} dias`}
          subtitleMobile={`${period}d`}
          gradient="from-violet-500/10 to-purple-500/5"
          iconColor="text-violet-400"
          labelColor="text-violet-300"
          hoverBorder="hover:border-violet-500/30"
        />
      </div>

      {/* Métricas adicionais */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
        <MetricCard
          icon={Percent}
          label="Taxa de conversão"
          labelMobile="Conversão"
          value={`${conversionRate}%`}
          subtitle="Free → Pro"
          subtitleMobile="Free→Pro"
          gradient="from-pink-500/10 to-rose-500/5"
          iconColor="text-pink-400"
          labelColor="text-pink-300"
          hoverBorder="hover:border-pink-500/30"
        />

        <MetricCard
          icon={DollarSign}
          label="Receita mensal estimada"
          labelMobile="Receita"
          value={`R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Baseado em assinaturas ativas"
          subtitleMobile="Estimada"
          gradient="from-green-500/10 to-emerald-500/5"
          iconColor="text-green-400"
          labelColor="text-green-300"
          hoverBorder="hover:border-green-500/30"
        />
      </div>

      {/* Gráficos */}
      <AdminCharts 
        userGrowthData={userGrowthData} 
        planDistribution={planDistribution} 
      />

      {/* Usuários recentes */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-4 backdrop-blur-sm sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-300 sm:text-base">
          Cadastros Recentes
        </h3>
        <div className="space-y-2">
          {(recentUsers ?? []).map((user, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Users size={12} className="text-blue-400" />
                </div>
                <span className="text-slate-300 truncate max-w-[150px] sm:max-w-none">
                  {user.email ?? '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {user.plan === 'pro' && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    PRO
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type MetricCardProps = {
  icon: LucideIcon
  label: string
  labelMobile: string
  value: number | string
  subtitle: string
  subtitleMobile: string
  gradient: string
  iconColor: string
  labelColor: string
  hoverBorder: string
}

function MetricCard({
  icon: Icon,
  label,
  labelMobile,
  value,
  subtitle,
  subtitleMobile,
  gradient,
  iconColor,
  labelColor,
  hoverBorder,
}: MetricCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${gradient} p-4 backdrop-blur-sm transition-all ${hoverBorder} sm:rounded-2xl sm:p-6`}>
      <div className="absolute -right-2 -top-2 opacity-10 sm:-right-4 sm:-top-4">
        <Icon size={60} className={`${iconColor} sm:h-20 sm:w-20`} />
      </div>
      <div className="relative">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${labelColor} sm:gap-2 sm:text-sm`}>
          <Icon size={14} className="sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{labelMobile}</span>
        </div>
        <div className="mt-1.5 text-xl font-bold tabular-nums text-white sm:mt-2 sm:text-3xl">
          {value}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
          <TrendingUp size={10} className="sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">{subtitle}</span>
          <span className="sm:hidden">{subtitleMobile}</span>
        </div>
      </div>
    </div>
  )
}

function generateGrowthData(
  users: { created_at: string; plan: string }[],
  period: string
): { date: string; total: number; pro: number }[] {
  if (!users.length) return []

  const days = period === 'all' ? 90 : parseInt(period)
  const now = new Date()
  const data: { date: string; total: number; pro: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]

    const usersUntilDate = users.filter(
      (u) => new Date(u.created_at).toISOString().split('T')[0] <= dateStr
    )

    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: usersUntilDate.length,
      pro: usersUntilDate.filter((u) => u.plan === 'pro').length,
    })
  }

  const step = Math.max(1, Math.floor(data.length / 10))
  return data.filter((_, i) => i % step === 0 || i === data.length - 1)
}
