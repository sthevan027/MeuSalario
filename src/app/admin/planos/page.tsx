import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { seedPlans } from '@/app/admin/actions'
import { RefreshCw, Package, Crown, Check, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PlanRow = {
  id: string
  name: string
  price_monthly: number | null
  price_yearly: number | null
  active: boolean
}

export default async function AdminPlanosPage() {
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

  const { data, error } = await admin
    .from('plans')
    .select('id, name, price_monthly, price_yearly, active')
    .order('id', { ascending: true })

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100 backdrop-blur-sm">
        Erro ao carregar planos: {error.message}
      </div>
    )
  }

  const rows = (data ?? []) as PlanRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Planos
          </h1>
          <p className="text-sm text-slate-400">
            Gerenciamento dos planos da plataforma (preços usados no checkout Stripe)
          </p>
        </div>

        <form action={seedPlans}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:border-emerald-500/50 hover:from-emerald-500/20 hover:to-teal-500/20"
          >
            <RefreshCw size={16} />
            Atualizar planos (Free/Pro)
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 py-16 text-center backdrop-blur-sm">
          <Package size={48} className="mb-3 text-slate-600" />
          <p className="text-slate-300">Nenhum plano cadastrado</p>
          <p className="mt-1 text-sm text-slate-500">Clique em &quot;Atualizar planos&quot; para seedar</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((p) => (
            <div 
              key={p.id} 
              className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all hover:shadow-lg ${
                p.id === 'pro' 
                  ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:border-amber-500/50 hover:shadow-amber-500/10' 
                  : 'border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/30 hover:border-white/20'
              }`}
            >
              <div className="absolute -right-8 -top-8 opacity-10">
                {p.id === 'pro' ? (
                  <Crown size={80} className="text-amber-400" />
                ) : (
                  <Package size={80} className="text-slate-400" />
                )}
              </div>

              <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      {p.id === 'pro' && <Crown size={18} className="text-amber-400" />}
                      <h3 className="text-2xl font-bold text-white">{p.name}</h3>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-slate-400">
                      <span className="font-mono">{p.id}</span>
                    </div>
                  </div>

                  {p.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                      <Check size={12} />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300 ring-1 ring-rose-500/20">
                      <X size={12} />
                      Inativo
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between rounded-lg bg-black/20 px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-400">Plano Mensal</div>
                      <div className="mt-0.5 text-2xl font-bold text-white">
                        {p.price_monthly !== null ? `R$ ${p.price_monthly.toFixed(2)}` : '-'}
                      </div>
                    </div>
                    {p.price_monthly !== null && (
                      <div className="text-xs text-slate-500">/mês</div>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between rounded-lg bg-black/20 px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-400">Plano Anual</div>
                      <div className="mt-0.5 text-2xl font-bold text-white">
                        {p.price_yearly !== null ? `R$ ${p.price_yearly.toFixed(2)}` : '-'}
                      </div>
                    </div>
                    {p.price_yearly !== null && (
                      <div className="text-xs text-slate-500">/ano</div>
                    )}
                  </div>

                  {p.price_monthly !== null && p.price_yearly !== null && p.price_monthly > 0 && (
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-300">
                      Economia anual: R$ {((p.price_monthly * 12) - p.price_yearly).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

