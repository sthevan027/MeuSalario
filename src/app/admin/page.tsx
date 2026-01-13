import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { Users, Crown, Activity, UserPlus, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
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

  const now = new Date()
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: totalUsers }, { count: proUsers }, { count: activeProUsers }, { count: newUsers30d }] =
    await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
      admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'pro')
        .in('subscription_status', ['active', 'trialing']),
      admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since30d),
    ])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-xs text-slate-400 sm:text-sm">Visão geral das métricas da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total de usuários */}
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-4 backdrop-blur-sm transition-all hover:border-blue-500/30 sm:rounded-2xl sm:p-6">
          <div className="absolute -right-2 -top-2 opacity-10 sm:-right-4 sm:-top-4">
            <Users size={60} className="text-blue-400 sm:h-20 sm:w-20" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-300 sm:gap-2 sm:text-sm">
              <Users size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Total de usuários</span>
              <span className="sm:hidden">Usuários</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums text-white sm:mt-2 sm:text-4xl">{totalUsers ?? 0}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
              <TrendingUp size={10} className="sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">Todos os cadastros</span>
              <span className="sm:hidden">Total</span>
            </div>
          </div>
        </div>

        {/* Usuários Pro */}
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 backdrop-blur-sm transition-all hover:border-amber-500/30 sm:rounded-2xl sm:p-6">
          <div className="absolute -right-2 -top-2 opacity-10 sm:-right-4 sm:-top-4">
            <Crown size={60} className="text-amber-400 sm:h-20 sm:w-20" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300 sm:gap-2 sm:text-sm">
              <Crown size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Usuários Pro</span>
              <span className="sm:hidden">Pro</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums text-white sm:mt-2 sm:text-4xl">{proUsers ?? 0}</div>
            <div className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
              <span className="hidden sm:inline">Total com plano Pro</span>
              <span className="sm:hidden">Total</span>
            </div>
          </div>
        </div>

        {/* Pro ativos */}
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 backdrop-blur-sm transition-all hover:border-emerald-500/30 sm:rounded-2xl sm:p-6">
          <div className="absolute -right-2 -top-2 opacity-10 sm:-right-4 sm:-top-4">
            <Activity size={60} className="text-emerald-400 sm:h-20 sm:w-20" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300 sm:gap-2 sm:text-sm">
              <Activity size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Pro ativos</span>
              <span className="sm:hidden">Ativos</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums text-white sm:mt-2 sm:text-4xl">{activeProUsers ?? 0}</div>
            <div className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
              <span className="hidden sm:inline">Com assinatura ativa</span>
              <span className="sm:hidden">Assinando</span>
            </div>
          </div>
        </div>

        {/* Novos (30 dias) */}
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4 backdrop-blur-sm transition-all hover:border-violet-500/30 sm:rounded-2xl sm:p-6">
          <div className="absolute -right-2 -top-2 opacity-10 sm:-right-4 sm:-top-4">
            <UserPlus size={60} className="text-violet-400 sm:h-20 sm:w-20" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-300 sm:gap-2 sm:text-sm">
              <UserPlus size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Novos (30 dias)</span>
              <span className="sm:hidden">Novos</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums text-white sm:mt-2 sm:text-4xl">{newUsers30d ?? 0}</div>
            <div className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
              <span className="hidden sm:inline">Últimos 30 dias</span>
              <span className="sm:hidden">30 dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

