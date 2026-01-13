import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { requirePro } from '@/lib/auth/profile'

type SimulationRow = {
  id: string
  contract_type: 'clt' | 'pj'
  input_json: any
  result_json: any
  created_at: string
}

function getKind(row: SimulationRow) {
  return String(row.input_json?.kind ?? 'monthly')
}

function getValue(row: SimulationRow) {
  const kind = getKind(row)
  if (kind === 'termination') return Number(row.result_json?.total ?? 0)
  return Number(row.result_json?.liquido ?? 0)
}

function getLabel(row: SimulationRow) {
  const kind = getKind(row)
  if (kind === 'termination') return 'Rescisão'
  if (kind === 'compare') return `Comparador (${row.contract_type.toUpperCase()})`
  return `Mensal (${row.contract_type.toUpperCase()})`
}

export default async function HistoricoPage() {
  await requirePro()

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('simulations')
    .select('id, contract_type, input_json, result_json, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

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

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-3 gap-3 border-b border-white/10 px-4 py-3 text-xs font-medium text-slate-300">
          <div>Tipo</div>
          <div>Data</div>
          <div className="text-right">Valor</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">Você ainda não salvou nenhuma simulação.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm">
                <div className="text-slate-100">{getLabel(r)}</div>
                <div className="text-slate-300">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
                <div className="text-right font-medium tabular-nums text-slate-50">{formatBRL(getValue(r))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

