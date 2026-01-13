import type { CompareInput, CompareResult, MonthlySimulationInput } from '@/lib/calculators/types'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { money } from '@/lib/calculators/utils'

export function compareCltVsPj(input: CompareInput): CompareResult {
  const base: Omit<MonthlySimulationInput, 'contractType'> = {
    salarioBase: input.salarioBase,
    jornadaMensalHoras: input.jornadaMensalHoras,
    horas50: input.horas50,
    horas100: input.horas100,
    horas150: input.horas150,
    atrasosHoras: input.atrasosHoras,
    adicionaisPercentual: input.adicionaisPercentual,
  }

  const clt = simulateMonthly({
    ...base,
    contractType: 'clt',
  })

  const pj = simulateMonthly({
    ...base,
    contractType: 'pj',
  })

  return { clt, pj, deltaLiquido: money(pj.liquido - clt.liquido) }
}

