import { clampNumber, money } from '@/lib/calculators/utils'
import { calcularINSS, calcularIRRF } from '@/lib/calculators/tax'
import type { VacationInput, VacationResult } from '@/lib/calculators/types'

/**
 * Simula o cálculo de férias (CLT)
 * 
 * Precisão estimada: 80-90%
 * 
 * Férias incluem:
 * - Férias vencidas: 1 período completo + 1/3 constitucional
 * - Férias proporcionais: baseado em meses trabalhados desde último período aquisitivo
 * 
 * @param input - Dados para cálculo de férias
 * @returns Resultado com valores de férias e descontos
 */
export function simulateVacation(input: VacationInput): VacationResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const mesesTrabalhados = clampNumber(input.mesesTrabalhados, 0, 12)
  const temFeriasVencidas = input.temFeriasVencidas ?? false
  const dependentes = clampNumber(input.dependentes ?? 0, 0, 20)

  // Férias vencidas: salário base + 1/3 constitucional
  const feriasVencidas = temFeriasVencidas ? money(salarioBase * (1 + 1 / 3)) : 0

  // Férias proporcionais: baseado em meses trabalhados
  // Considera que cada mês trabalhado dá direito a 1/12 do salário + 1/3
  const feriasProporcionais = mesesTrabalhados > 0 
    ? money((salarioBase * (mesesTrabalhados / 12)) * (1 + 1 / 3))
    : 0

  // Total bruto de férias
  const totalBruto = money(feriasVencidas + feriasProporcionais)

  // Descontos sobre férias (INSS e IRRF)
  const inss = calcularINSS(totalBruto)
  const irrf = calcularIRRF(totalBruto, inss, dependentes)
  const descontos = money(inss + irrf)

  // Total líquido
  const totalLiquido = money(totalBruto - descontos)

  const items = [
    ...(temFeriasVencidas ? [{ key: 'vencidas', label: 'Férias vencidas + 1/3', amount: feriasVencidas, kind: 'earning' as const }] : []),
    ...(feriasProporcionais > 0 ? [{ key: 'proporcionais', label: `Férias proporcionais (${mesesTrabalhados} meses) + 1/3`, amount: feriasProporcionais, kind: 'earning' as const }] : []),
    { key: 'inss', label: 'INSS sobre férias', amount: inss, kind: 'deduction' as const },
    { key: 'irrf', label: 'IRRF sobre férias', amount: irrf, kind: 'deduction' as const },
  ]

  return {
    feriasVencidas,
    feriasProporcionais,
    totalBruto,
    inss,
    irrf,
    descontos,
    totalLiquido,
    items,
  }
}
