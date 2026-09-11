import type { MeiAlertResult } from '@/lib/calculators/mei'

const STATUS_STYLES: Record<MeiAlertResult['status'], { border: string; bg: string; text: string; label: string }> = {
  tranquilo: { border: 'border-emerald-400/20', bg: 'bg-emerald-500/10', text: 'text-emerald-100', label: 'Tranquilo' },
  atencao: { border: 'border-amber-400/20', bg: 'bg-amber-500/10', text: 'text-amber-100', label: 'Atenção' },
  alerta: { border: 'border-orange-400/30', bg: 'bg-orange-500/10', text: 'text-orange-100', label: 'Alerta' },
  estourado: { border: 'border-rose-400/30', bg: 'bg-rose-500/10', text: 'text-rose-100', label: 'Estourado' },
}

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MeiAlertCard({ result }: { result: MeiAlertResult }) {
  const style = STATUS_STYLES[result.status]
  const pct = Math.min(100, result.percentualUtilizado * 100)

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Teto anual do MEI</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.text} ${style.bg} border ${style.border}`}>
          {style.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${
              result.status === 'estourado' || result.status === 'alerta'
                ? 'bg-rose-500'
                : result.status === 'atencao'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {brl(result.faturamentoAcumuladoAno)} de {brl(result.limiteAnual)} ({(result.percentualUtilizado * 100).toFixed(1)}%)
        </p>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-slate-300">
        {result.insights.map((insight, i) => (
          <li key={i}>{insight}</li>
        ))}
      </ul>
    </div>
  )
}
