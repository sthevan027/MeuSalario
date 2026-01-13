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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-sm text-slate-400">Visão geral das métricas da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de usuários */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-6 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Users size={80} className="text-blue-400" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
              <Users size={16} />
              Total de usuários
            </div>
            <div className="mt-2 text-4xl font-bold tabular-nums text-white">{totalUsers ?? 0}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <TrendingUp size={12} />
              Todos os cadastros
            </div>
          </div>
        </div>

        {/* Usuários Pro */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Crown size={80} className="text-amber-400" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
              <Crown size={16} />
              Usuários Pro
            </div>
            <div className="mt-2 text-4xl font-bold tabular-nums text-white">{proUsers ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">Total com plano Pro</div>
          </div>
        </div>

        {/* Pro ativos */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Activity size={80} className="text-emerald-400" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Activity size={16} />
              Pro ativos
            </div>
            <div className="mt-2 text-4xl font-bold tabular-nums text-white">{activeProUsers ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">Com assinatura ativa</div>
          </div>
        </div>

        {/* Novos (30 dias) */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-6 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10">
          <div className="absolute -right-4 -top-4 opacity-10">
            <UserPlus size={80} className="text-violet-400" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-300">
              <UserPlus size={16} />
              Novos (30 dias)
            </div>
            <div className="mt-2 text-4xl font-bold tabular-nums text-white">{newUsers30d ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">Últimos 30 dias</div>
          </div>
        </div>
      </div>
    </div>
  )
}

