import { SubscribeButtons } from '@/components/billing/SubscribeButtons'
import { ManageSubscription } from '@/components/billing/ManageSubscription'
import { CancelSubscription } from '@/components/billing/CancelSubscription'
import { LinkedAccounts } from '@/components/account/LinkedAccounts'
import { getDisplayName } from '@/lib/greetings'
import { requireUser, isGoogleLinked } from '@/lib/auth/profile'

export default async function ContaPage() {
  const [profile, googleLinked] = await Promise.all([
    requireUser(),
    isGoogleLinked(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Minha Conta</h1>
        <p className="mt-1 text-slate-400">Gerencie suas informações e assinatura</p>
      </div>

      {/* Info do usuário */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-white">Informações Pessoais</h2>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-400">Nome</div>
            <div className="text-sm font-medium text-white">
              {getDisplayName(profile)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Email</div>
            <div className="text-sm font-medium text-white">{profile.email || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Contas vinculadas (Google, etc) */}
      <LinkedAccounts isGoogleLinked={googleLinked} userEmail={profile.email} />

      {/* Info do plano */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-white">Plano Atual</h2>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-400">Plano</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase text-white">{profile.plan ?? 'FREE'}</span>
              {profile.plan === 'pro' && (
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                  PRO
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Status</div>
            <div className="text-sm text-white">
              {profile.subscription_status === 'active' ? '✓ Ativo' : 'Sem assinatura'}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade para Pro */}
      {profile.plan !== 'pro' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 backdrop-blur-sm">
          <h2 className="mb-2 text-xl font-bold text-white">Desbloquear Pro</h2>
          <p className="mb-4 text-slate-300">
            Dashboard completo, histórico, gráficos, rescisão, comparador e exportação.
          </p>
          <div className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            ✨ 14 dias grátis para experimentar • Use código promocional no checkout
          </div>
          <SubscribeButtons />
        </div>
      )}

      {/* Gerenciar Assinatura Pro */}
      {profile.plan === 'pro' && (
        <>
          <ManageSubscription />
          <CancelSubscription />
        </>
      )}
    </div>
  )
}

