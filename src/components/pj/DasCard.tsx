import type { DasDoMesResult } from '@/lib/calculators/revenue'

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-')
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`
}

function formatData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function DasCard({ das }: { das: DasDoMesResult }) {
  const urgente = das.diasParaVencer !== null && das.diasParaVencer <= 5 && das.diasParaVencer >= 0
  const vencido = das.diasParaVencer !== null && das.diasParaVencer < 0

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">DAS — {formatCompetencia(das.competencia)}</h3>
        <span className="text-xs text-slate-500">Anexo {das.anexo}</span>
      </div>

      <p className="mt-2 text-2xl font-bold text-white">{brl(das.valorDas)}</p>
      <p className="text-xs text-slate-400">
        Base: faturamento do mês {brl(das.faturamentoMensal)} · RBT12 {brl(das.faturamentoAcumulado12Meses)}
      </p>

      <div
        className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
          vencido
            ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
            : urgente
              ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
              : 'border-white/10 bg-slate-900/40 text-slate-300'
        }`}
      >
        Vencimento: {formatData(das.vencimento)}
        {das.diasParaVencer !== null && (
          <>
            {' — '}
            {vencido
              ? `venceu há ${Math.abs(das.diasParaVencer)} dia(s)`
              : das.diasParaVencer === 0
                ? 'vence hoje'
                : `${das.diasParaVencer} dia(s) restantes`}
          </>
        )}
      </div>

      {das.faturamentoMensal === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Sem faturamento lançado para este mês ainda — DAS mostrado é R$ 0,00.
        </p>
      )}

      <p className="mt-3 text-[10px] text-slate-500">
        * Estimativa com base no faturamento lançado. Vencimento aproximado (dia 20 do mês seguinte) — confirme no
        PGDAS-D/carnê-leão oficial.
      </p>
    </div>
  )
}
