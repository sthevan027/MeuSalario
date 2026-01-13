import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { setUserPlan, setUserRole } from '@/app/admin/actions'
import { Button } from '@/components/ui/Button'
import { Crown, Shield, User, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string | null
  plan: 'free' | 'pro'
  role: 'user' | 'admin'
  subscription_status: string
  created_at: string
}

export default async function AdminUsuariosPage() {
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

  const { data, error} = await admin
    .from('profiles')
    .select('id, email, plan, role, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100 backdrop-blur-sm">
        Erro ao carregar usuários: {error.message}
      </div>
    )
  }

  const rows = (data ?? []) as ProfileRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Usuários
          </h1>
          <p className="text-sm text-slate-400">
            Gerencie planos e cargos dos usuários ({rows.length} de 100 exibidos)
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm">
        <div className="grid grid-cols-6 gap-4 border-b border-white/10 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <div>Usuário</div>
          <div>Plano</div>
          <div>Cargo</div>
          <div>Status</div>
          <div>Cadastro</div>
          <div className="text-right">Ações</div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User size={48} className="mb-3 text-slate-600" />
            <p className="text-slate-300">Nenhum usuário cadastrado ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((u) => (
              <div key={u.id} className="grid grid-cols-6 gap-4 px-6 py-4 text-sm transition-colors hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <User size={14} className="text-blue-400" />
                  </div>
                  <div className="truncate text-slate-100">{u.email ?? '-'}</div>
                </div>

                <div className="flex items-center">
                  <form action={setUserPlan} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="plan"
                      defaultValue={u.plan}
                      className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-slate-100 outline-none transition-colors focus:border-amber-400/60 focus:bg-white/10"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                    <button 
                      type="submit"
                      className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      ✓
                    </button>
                  </form>
                  {u.plan === 'pro' && (
                    <Crown size={14} className="ml-2 text-amber-400" />
                  )}
                </div>

                <div className="flex items-center">
                  <form action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-slate-100 outline-none transition-colors focus:border-violet-400/60 focus:bg-white/10"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      type="submit"
                      className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      ✓
                    </button>
                  </form>
                  {u.role === 'admin' && (
                    <Shield size={14} className="ml-2 text-violet-400" />
                  )}
                </div>

                <div className="flex items-center">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    u.subscription_status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20' 
                      : u.subscription_status === 'trialing'
                      ? 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20'
                      : u.subscription_status === 'past_due'
                      ? 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20'
                      : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                  }`}>
                    {u.subscription_status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={12} />
                  <span className="text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center justify-end">
                  <span className="text-xs font-mono text-slate-500">{u.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

