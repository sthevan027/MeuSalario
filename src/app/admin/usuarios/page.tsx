import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { setUserPlan, setUserRole } from '@/app/admin/actions'
import { Crown, Shield, User, Calendar } from 'lucide-react'
import { UserFilters } from '@/components/admin/UserFilters'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string | null
  plan: 'free' | 'pro'
  role: 'user' | 'admin'
  subscription_status: string
  created_at: string
}

type SearchParams = {
  search?: string
  plan?: string
  status?: string
  page?: string
}

const ITEMS_PER_PAGE = 20

export default async function AdminUsuariosPage({
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

  const search = searchParams.search || ''
  const planFilter = searchParams.plan || 'all'
  const statusFilter = searchParams.status || 'all'
  const page = parseInt(searchParams.page || '1')
  const offset = (page - 1) * ITEMS_PER_PAGE

  let query = admin
    .from('profiles')
    .select('id, email, plan, role, subscription_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }
  if (planFilter !== 'all') {
    query = query.eq('plan', planFilter)
  }
  if (statusFilter !== 'all') {
    if (statusFilter === 'none') {
      query = query.or('subscription_status.is.null,subscription_status.eq.')
    } else {
      query = query.eq('subscription_status', statusFilter)
    }
  }

  const { data, error, count } = await query

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100 backdrop-blur-sm">
        Erro ao carregar usuários: {error.message}
      </div>
    )
  }

  const rows = (data ?? []) as ProfileRow[]
  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent sm:text-3xl">
            Usuários
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            Gerencie planos e cargos dos usuários ({count ?? 0} total)
          </p>
        </div>

        <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/5" />}>
          <UserFilters />
        </Suspense>
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm lg:block">
        <div className="grid grid-cols-6 gap-4 border-b border-white/10 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <div className="col-span-2">Usuário</div>
          <div>Plano</div>
          <div>Cargo</div>
          <div>Status</div>
          <div>Cadastro</div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User size={48} className="mb-3 text-slate-600" />
            <p className="text-slate-300">Nenhum usuário encontrado</p>
            {(search || planFilter !== 'all' || statusFilter !== 'all') && (
              <p className="mt-1 text-sm text-slate-500">Tente ajustar os filtros</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((u) => (
              <div key={u.id} className="grid grid-cols-6 gap-4 px-6 py-4 text-sm transition-colors hover:bg-white/5">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <User size={16} className="text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-slate-100 font-medium">{u.email ?? '-'}</div>
                    <div className="text-xs font-mono text-slate-500">{u.id.slice(0, 8)}...</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <form action={setUserPlan} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="plan"
                      defaultValue={u.plan}
                      className="w-20 appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-2 py-1.5 pr-6 text-xs font-medium text-slate-100 outline-none transition-colors focus:border-amber-400/60 focus:bg-slate-800/50"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '12px'
                      }}
                    >
                      <option value="free" className="bg-slate-900 text-slate-100">Free</option>
                      <option value="pro" className="bg-slate-900 text-slate-100">Pro</option>
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
                      className="w-20 appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-2 py-1.5 pr-6 text-xs font-medium text-slate-100 outline-none transition-colors focus:border-violet-400/60 focus:bg-slate-800/50"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '12px'
                      }}
                    >
                      <option value="user" className="bg-slate-900 text-slate-100">User</option>
                      <option value="admin" className="bg-slate-900 text-slate-100">Admin</option>
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
                  <StatusBadge status={u.subscription_status} />
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={12} />
                  <span className="text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Cards */}
      <div className="space-y-3 lg:hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 py-12 text-center backdrop-blur-sm">
            <User size={48} className="mb-3 text-slate-600" />
            <p className="text-slate-300">Nenhum usuário encontrado</p>
          </div>
        ) : (
          rows.map((u) => (
            <div key={u.id} className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <User size={14} className="text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{u.email ?? '-'}</div>
                    <div className="text-xs font-mono text-slate-500">{u.id.slice(0, 8)}</div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {u.plan === 'pro' && (
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <Crown size={10} />
                      PRO
                    </div>
                  )}
                  {u.role === 'admin' && (
                    <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                      <Shield size={10} />
                      ADMIN
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={12} />
                  <span className="text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <StatusBadge status={u.subscription_status} small />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <form action={setUserPlan} className="flex flex-col gap-1.5">
                  <input type="hidden" name="userId" value={u.id} />
                  <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Plano</label>
                  <div className="flex gap-1.5">
                    <select
                      name="plan"
                      defaultValue={u.plan}
                      className="flex-1 appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-2 py-1.5 pr-6 text-xs font-medium text-slate-100 outline-none transition-colors focus:border-amber-400/60 focus:bg-slate-800/50"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '12px'
                      }}
                    >
                      <option value="free" className="bg-slate-900 text-slate-100">Free</option>
                      <option value="pro" className="bg-slate-900 text-slate-100">Pro</option>
                    </select>
                    <button 
                      type="submit"
                      className="rounded-lg bg-white/5 px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      ✓
                    </button>
                  </div>
                </form>

                <form action={setUserRole} className="flex flex-col gap-1.5">
                  <input type="hidden" name="userId" value={u.id} />
                  <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Cargo</label>
                  <div className="flex gap-1.5">
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="flex-1 appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-2 py-1.5 pr-6 text-xs font-medium text-slate-100 outline-none transition-colors focus:border-violet-400/60 focus:bg-slate-800/50"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '12px'
                      }}
                    >
                      <option value="user" className="bg-slate-900 text-slate-100">User</option>
                      <option value="admin" className="bg-slate-900 text-slate-100">Admin</option>
                    </select>
                    <button 
                      type="submit"
                      className="rounded-lg bg-white/5 px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      ✓
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} searchParams={searchParams} />
      )}
    </div>
  )
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const statusConfig: Record<string, { bg: string; text: string; ring: string; label: string }> = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/20', label: 'Ativo' },
    trialing: { bg: 'bg-blue-500/10', text: 'text-blue-300', ring: 'ring-blue-500/20', label: 'Trial' },
    past_due: { bg: 'bg-rose-500/10', text: 'text-rose-300', ring: 'ring-rose-500/20', label: 'Inadimplente' },
    canceled: { bg: 'bg-orange-500/10', text: 'text-orange-300', ring: 'ring-orange-500/20', label: 'Cancelado' },
  }

  const config = statusConfig[status] || { 
    bg: 'bg-slate-500/10', 
    text: 'text-slate-400', 
    ring: 'ring-slate-500/20', 
    label: status || 'Sem assinatura' 
  }

  return (
    <span className={`inline-flex rounded-full ${config.bg} ${config.text} ring-1 ${config.ring} ${
      small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
    } font-medium`}>
      {config.label}
    </span>
  )
}

function Pagination({ 
  currentPage, 
  totalPages, 
  searchParams 
}: { 
  currentPage: number
  totalPages: number
  searchParams: SearchParams 
}) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (searchParams.search) params.set('search', searchParams.search)
    if (searchParams.plan) params.set('plan', searchParams.plan)
    if (searchParams.status) params.set('status', searchParams.status)
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <a
          href={createPageUrl(currentPage - 1)}
          className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          Anterior
        </a>
      )}
      
      <span className="text-sm text-slate-400">
        Página {currentPage} de {totalPages}
      </span>

      {currentPage < totalPages && (
        <a
          href={createPageUrl(currentPage + 1)}
          className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          Próxima
        </a>
      )}
    </div>
  )
}
