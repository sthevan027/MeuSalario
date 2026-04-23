import { Info } from 'lucide-react'

type SimulationDisclaimerProps = {
  className?: string
}

export function SimulationDisclaimer({ className }: SimulationDisclaimerProps) {
  return (
    <div className={['flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80', className].filter(Boolean).join(' ')}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
      <p>
        <span className="font-medium text-amber-300/90">Valores estimados (precisão ~80–90%).</span>{' '}
        Os cálculos seguem a legislação vigente de 2026, mas não consideram acordos coletivos,
        benefícios personalizados, descontos judiciais ou convenções sindicais específicas.
        Consulte um contador para confirmação.
      </p>
    </div>
  )
}
