import { unstable_cache } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePro } from '@/lib/auth/profile'
import { HistoryTable } from '@/components/historico/HistoryTable'

type SimulationRow = {
  id: string
  contract_type: 'clt' | 'pj'
  input_json: any
  result_json: any
  created_at: string
}

export default async function HistoricoPage() {
  const profile = await requirePro()
  const supabase = createSupabaseServerClient()

  // Cache 60s para reduzir carga no Supabase
  const getCachedSimulations = unstable_cache(
    async () => {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, contract_type, input_json, result_json, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)
      return { data, error }
    },
    [`simulations-history-${profile.id}`],
    { revalidate: 60, tags: [`simulations-${profile.id}`] }
  )

  const { data, error } = await getCachedSimulations()

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
        Erro ao carregar histórico: {error.message}
      </div>
    )
  }

  const rows = (data ?? []) as SimulationRow[]

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-sm text-slate-300">Últimas simulações salvas.</p>
      </div>

      <HistoryTable rows={rows} />
    </div>
  )
}
