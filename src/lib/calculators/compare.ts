import type { CompareInput, CompareResult, MonthlySimulationInput } from '@/lib/calculators/types'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { money } from '@/lib/calculators/utils'

/**
 * Compara salário líquido entre CLT e PJ
 * 
 * Precisão estimada: 80-90%
 * 
 * Usa cálculo real de impostos quando disponível:
 * - CLT: INSS e IRRF automáticos (tabelas 2026)
 * - PJ: DAS (Simples Nacional) + INSS/IRRF sobre pró-labore (se pró-labore e anexo informados)
 * - PJ: Percentual genérico (se pró-labore e anexo não informados)
 * 
 * @param input - Dados para comparação
 * @returns Resultado com cálculos CLT e PJ e diferença
 */
export function compareCltVsPj(input: CompareInput): CompareResult {
  // Verifica se usa cálculo real de PJ
  const usaCalculoRealPJ = input.proLabore !== undefined && input.anexoSimplesNacional !== undefined

  const base: Omit<MonthlySimulationInput, 'contractType'> = {
    salarioBase: input.salarioBase,
    jornadaMensalHoras: input.jornadaMensalHoras,
    horas50: input.horas50,
    horas100: input.horas100,
    horas150: input.horas150,
    atrasosHoras: input.atrasosHoras,
    adicionaisPercentual: input.adicionaisPercentual,
  }

  // CLT: sempre usa cálculo real (INSS + IRRF automáticos)
  const clt = simulateMonthly({
    ...base,
    contractType: 'clt',
    dependentes: input.dependentes ?? 0,
  })

  // PJ: usa cálculo real se disponível, senão usa percentual genérico
  const pj = simulateMonthly({
    ...base,
    contractType: 'pj',
    proLabore: usaCalculoRealPJ ? input.proLabore : undefined,
    anexoSimplesNacional: usaCalculoRealPJ ? input.anexoSimplesNacional : undefined,
    faturamentoAnualAcumulado: usaCalculoRealPJ ? input.faturamentoAnualAcumulado : undefined,
    descontosPercentual: !usaCalculoRealPJ ? (input.descontosPjPercentual ?? 10) : undefined,
  })

  return { clt, pj, deltaLiquido: money(pj.liquido - clt.liquido) }
}

