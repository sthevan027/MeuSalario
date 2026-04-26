import { clampNumber, money } from '@/lib/calculators/utils'
import { calcularINSS, calcularIRRF } from '@/lib/calculators/tax'
import type { ThirteenthInput, ThirteenthResult } from '@/lib/calculators/types'

/**
 * Simula o cálculo de 13º salário (CLT)
 * 
 * Precisão estimada: 80-90%
 * 
 * O 13º salário é pago em duas parcelas:
 * - 1ª parcela: até 30/11 (50% do salário base, sem descontos)
 * - 2ª parcela: até 20/12 (50% do salário base, com descontos de INSS e IRRF)
 * 
 * @param input - Dados para cálculo do 13º salário
 * @returns Resultado com valores das parcelas e total
 */
export function simulateThirteenth(input: ThirteenthInput): ThirteenthResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const mesesTrabalhados = clampNumber(input.mesesTrabalhados, 1, 12)
  const dependentes = clampNumber(input.dependentes ?? 0, 0, 20)
  const recebeuPrimeiraParcela = input.recebeuPrimeiraParcela ?? false

  // Valor base do 13º (proporcional aos meses trabalhados)
  const valorBase = money(salarioBase * (mesesTrabalhados / 12))

  // 1ª parcela: 50% do valor base, sem descontos
  const primeiraParcela = money(valorBase * 0.5)

  // 2ª parcela: 50% do valor base, com descontos
  // INSS e IRRF são calculados sobre o valor total do 13º (valorBase), não apenas sobre os 50%.
  // A dedução aparece integralmente na 2ª parcela (prática legal padrão).
  const segundaParcelaBase = money(valorBase * 0.5)
  const inss = calcularINSS(valorBase)
  const irrf = calcularIRRF(valorBase, inss, dependentes)
  const descontosSegundaParcela = money(inss + irrf)
  const segundaParcelaLiquida = money(segundaParcelaBase - descontosSegundaParcela)

  // Total líquido
  const totalLiquido = recebeuPrimeiraParcela 
    ? segundaParcelaLiquida 
    : money(primeiraParcela + segundaParcelaLiquida)

  const items = [
    { key: 'base', label: '13º salário (base)', amount: valorBase, kind: 'info' as const },
    { key: 'primeira', label: '1ª parcela (50% - sem descontos)', amount: primeiraParcela, kind: 'earning' as const },
    { key: 'segunda_base', label: '2ª parcela (50% - base)', amount: segundaParcelaBase, kind: 'info' as const },
    { key: 'inss', label: 'INSS sobre 13º salário (base: total)', amount: inss, kind: 'deduction' as const },
    { key: 'irrf', label: 'IRRF sobre 13º salário (base: total)', amount: irrf, kind: 'deduction' as const },
    { key: 'segunda_liquida', label: '2ª parcela líquida', amount: segundaParcelaLiquida, kind: 'earning' as const },
  ]

  return {
    valorBase,
    primeiraParcela,
    segundaParcelaBase,
    segundaParcelaLiquida,
    inss,
    irrf,
    descontosSegundaParcela,
    totalLiquido,
    items,
  }
}
