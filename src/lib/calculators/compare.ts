import type { CompareInput, CompareResult, MonthlySimulationInput } from '@/lib/calculators/types'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { money } from '@/lib/calculators/utils'

function estimatePjBrutoForTargetLiquido({
  targetLiquido,
  baseInput,
  proLaboreRatio,
}: {
  targetLiquido: number
  baseInput: Omit<MonthlySimulationInput, 'contractType' | 'salarioBase' | 'proLabore'>
  proLaboreRatio: number | null
}): number | null {
  if (!Number.isFinite(targetLiquido) || targetLiquido <= 0) return null

  const simulateForBruto = (bruto: number) => {
    const proLabore = proLaboreRatio != null ? Math.max(0, bruto * proLaboreRatio) : undefined
    return simulateMonthly({
      ...baseInput,
      contractType: 'pj',
      salarioBase: bruto,
      proLabore,
    }).liquido
  }

  // Encontra um teto alto o suficiente
  let lo = 0
  let hi = Math.max(1000, targetLiquido * 1.2)
  let liqHi = simulateForBruto(hi)
  let guard = 0
  while (liqHi < targetLiquido && guard < 24) {
    hi *= 1.6
    liqHi = simulateForBruto(hi)
    guard++
  }
  if (liqHi < targetLiquido) return null

  // Busca binária pelo bruto que iguala o líquido alvo
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2
    const liq = simulateForBruto(mid)
    if (liq >= targetLiquido) {
      hi = mid
    } else {
      lo = mid
    }
  }

  return money(hi)
}

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

  const proLaboreRatio =
    usaCalculoRealPJ && input.proLabore != null && input.salarioBase > 0 ? input.proLabore / input.salarioBase : null

  const pjBrutoEquivalenteCltLiquido = estimatePjBrutoForTargetLiquido({
    targetLiquido: clt.liquido,
    baseInput: {
      ...base,
      anexoSimplesNacional: usaCalculoRealPJ ? input.anexoSimplesNacional : undefined,
      faturamentoAnualAcumulado: usaCalculoRealPJ ? input.faturamentoAnualAcumulado : undefined,
      descontosPercentual: !usaCalculoRealPJ ? (input.descontosPjPercentual ?? 10) : undefined,
    },
    proLaboreRatio,
  })

  return {
    clt,
    pj: {
      ...pj,
      pjBrutoEquivalenteCltLiquido: pjBrutoEquivalenteCltLiquido ?? undefined,
    },
    deltaLiquido: money(pj.liquido - clt.liquido),
  }
}

