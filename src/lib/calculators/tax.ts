import { money } from './utils'

/**
 * Tabela de INSS 2024/2025 (CLT)
 * Alíquotas progressivas por faixa salarial
 */
const INSS_BRACKETS = [
  { limit: 1320.0, rate: 0.075 },
  { limit: 2571.29, rate: 0.09 },
  { limit: 3856.94, rate: 0.12 },
  { limit: 7507.49, rate: 0.14 },
] as const

const INSS_MAX = 908.85 // Teto do INSS (14% de R$ 7.507,49)

/**
 * Tabela de IRRF 2024/2025
 * Alíquotas progressivas por faixa salarial (base de cálculo: bruto - INSS)
 */
const IRRF_BRACKETS = [
  { limit: 2112.0, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 158.4 },
  { limit: 3751.05, rate: 0.15, deduction: 370.4 },
  { limit: 4664.68, rate: 0.225, deduction: 651.73 },
  { limit: Infinity, rate: 0.275, deduction: 884.96 },
] as const

/**
 * Calcula o INSS com alíquotas progressivas (CLT)
 * Cada faixa é calculada separadamente e somada
 * 
 * @param salarioBruto - Salário bruto (base de cálculo)
 * @returns Valor do desconto de INSS
 */
export function calcularINSS(salarioBruto: number): number {
  if (salarioBruto <= 0) return 0

  let inssTotal = 0
  let previousLimit = 0

  for (const bracket of INSS_BRACKETS) {
    if (salarioBruto > previousLimit) {
      const faixaBase = Math.min(salarioBruto, bracket.limit) - previousLimit
      inssTotal += faixaBase * bracket.rate
      previousLimit = bracket.limit
    } else {
      break
    }
  }

  // Aplica o teto do INSS
  return money(Math.min(inssTotal, INSS_MAX))
}

/**
 * Calcula o IRRF com alíquotas progressivas
 * Base de cálculo: salário bruto - INSS
 * 
 * @param salarioBruto - Salário bruto
 * @param inss - Valor do INSS já calculado
 * @returns Valor do desconto de IRRF
 */
export function calcularIRRF(salarioBruto: number, inss: number): number {
  const baseCalculo = salarioBruto - inss

  if (baseCalculo <= 0) return 0

  // Encontra a faixa correspondente
  for (const bracket of IRRF_BRACKETS) {
    if (baseCalculo <= bracket.limit) {
      const irrf = baseCalculo * bracket.rate - bracket.deduction
      return money(Math.max(0, irrf))
    }
  }

  return 0
}

/**
 * Calcula INSS e IRRF de uma vez
 * 
 * @param salarioBruto - Salário bruto (base de cálculo)
 * @returns Objeto com INSS, IRRF e total de descontos
 */
export function calcularDescontos(salarioBruto: number): {
  inss: number
  irrf: number
  total: number
} {
  const inss = calcularINSS(salarioBruto)
  const irrf = calcularIRRF(salarioBruto, inss)
  const total = money(inss + irrf)

  return { inss, irrf, total }
}

/**
 * Para PJ, geralmente não há INSS/IRRF retido na fonte da mesma forma
 * Essa função retorna valores zerados, mas pode ser customizada conforme necessário
 * 
 * @param faturamentoBruto - Faturamento bruto do PJ
 * @returns Objeto com impostos aproximados (simplificado)
 */
export function calcularDescontosPJ(faturamentoBruto: number): {
  inss: number
  irrf: number
  issqn: number
  total: number
} {
  // PJ normalmente paga via Simples Nacional ou Lucro Presumido
  // Aqui é uma estimativa muito simplificada (5% de INSS + 1,65% de ISS aprox)
  const inss = money(faturamentoBruto * 0.05)
  const issqn = money(faturamentoBruto * 0.0165)
  const irrf = 0 // Geralmente não há retenção na fonte para PJ

  return {
    inss,
    irrf,
    issqn,
    total: money(inss + irrf + issqn),
  }
}
