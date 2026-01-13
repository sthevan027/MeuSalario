import { clampNumber, money } from '@/lib/calculators/utils'
import type { TerminationInput, TerminationResult } from '@/lib/calculators/types'

export function simulateTermination(input: TerminationInput): TerminationResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const mesesTrabalhadosNoAno = clampNumber(input.mesesTrabalhadosNoAno, 0, 12)
  const avisoPrevioDias = clampNumber(input.avisoPrevioDias, 0, 90)
  const feriasVencidas = !!input.feriasVencidas
  const saldoFgtsMesesEstimado = clampNumber(input.saldoFgtsMesesEstimado, 0, 600)

  const avisoPrevio = money((salarioBase / 30) * avisoPrevioDias)

  const feriasVencidasValor = feriasVencidas ? money(salarioBase * (1 + 1 / 3)) : 0
  const feriasProporcionais = money((salarioBase * (mesesTrabalhadosNoAno / 12)) * (1 + 1 / 3))
  const decimoTerceiroProporcional = money(salarioBase * (mesesTrabalhadosNoAno / 12))

  // FGTS estimado: 8% por mês do salário base. Multa: 40%.
  const saldoFgtsEstimado = money(salarioBase * 0.08 * saldoFgtsMesesEstimado)
  const multaFgts = money(saldoFgtsEstimado * 0.4)

  const items = [
    { key: 'aviso', label: 'Aviso prévio', amount: avisoPrevio, kind: 'earning' as const },
    { key: 'ferias_venc', label: 'Férias vencidas + 1/3', amount: feriasVencidasValor, kind: 'earning' as const },
    { key: 'ferias_prop', label: 'Férias proporcionais + 1/3', amount: feriasProporcionais, kind: 'earning' as const },
    { key: '13_prop', label: '13º proporcional', amount: decimoTerceiroProporcional, kind: 'earning' as const },
    { key: 'fgts_multa', label: 'Multa FGTS (estimativa)', amount: multaFgts, kind: 'earning' as const },
    {
      key: 'fgts_info',
      label: 'Saldo FGTS estimado (info)',
      amount: saldoFgtsEstimado,
      kind: 'info' as const,
    },
  ].filter((i) => i.amount !== 0 || i.kind === 'info')

  const total = money(
    avisoPrevio + feriasVencidasValor + feriasProporcionais + decimoTerceiroProporcional + multaFgts
  )

  return { total, items }
}

