import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { createSupabaseServerClient, type CookieStore } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/profile'
import { getRecentRevenueEntries } from '@/lib/pj-revenue-data'
import { FaturamentoDashboard } from '@/components/pj/FaturamentoDashboard'
import { getTaxConfig } from '@/lib/tax-config'

export default async function FaturamentoPage() {
  const profile = await requireUser()
  const cookieStore = await cookies()

  const getCachedEntries = unstable_cache(
    async (store: CookieStore) => {
      const supabase = await createSupabaseServerClient(store)
      return getRecentRevenueEntries(supabase, profile.id)
    },
    [`pj-revenue-${profile.id}`],
    { revalidate: 60, tags: [`pj-revenue-${profile.id}`] }
  )

  const [entries, taxConfig] = await Promise.all([getCachedEntries(cookieStore), getTaxConfig()])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Faturamento PJ/MEI</h1>
        <p className="text-sm text-slate-300">
          Lance seu faturamento mensal (ou importe do extrato) pra acompanhar o DAS real e o teto do MEI.
        </p>
      </div>

      <FaturamentoDashboard
        initialEntries={entries}
        anexoInicial={profile.anexo_simples_nacional}
        meiLimiteAnual={taxConfig.mei_limite_anual}
      />
    </div>
  )
}
