import { money } from './utils'
import { getTaxConfigSync } from '@/lib/tax-config'

/**
 * Calcula o INSS com alíquotas progressivas (CLT)
 * Cada faixa é calculada separadamente e somada
 * 
 * @param salarioBruto - Salário bruto (base de cálculo)
 * @returns Valor do desconto de INSS
 */
export function calcularINSS(salarioBruto: number): number {
  if (salarioBruto <= 0) return 0

  const { inss_brackets, inss_max } = getTaxConfigSync()

  let inssTotal = 0
  let previousLimit = 0

  for (const bracket of inss_brackets) {
    if (salarioBruto > previousLimit) {
      const faixaBase = Math.min(salarioBruto, bracket.limit) - previousLimit
      inssTotal += faixaBase * bracket.rate
      previousLimit = bracket.limit
    } else {
      break
    }
  }

  return money(Math.min(inssTotal, inss_max))
}

/**
 * Núcleo do cálculo do IRRF sobre uma base já deduzida (salário - INSS - dependentes).
 * Aplica o complemento de isenção da Lei 15.270/2025: entre R$ 5.000 e R$ 7.786,72 o
 * imposto é reduzido linearmente para evitar o efeito cliff.
 */
function calcularIRRFSobreBase(baseCalculo: number): number {
  const { irrf_brackets, irrf_isencao, irrf_isencao_break_even } = getTaxConfigSync()

  if (baseCalculo <= 0) return 0
  if (baseCalculo <= irrf_isencao) return 0

  let irrfNormal = 0
  for (const bracket of irrf_brackets) {
    if (baseCalculo <= bracket.limit) {
      irrfNormal = baseCalculo * bracket.rate - bracket.deduction
      break
    }
  }
  irrfNormal = Math.max(0, irrfNormal)

  // Complemento de isenção (Lei 15.270/2025): redução gradual entre irrf_isencao e break_even
  if (irrf_isencao_break_even > irrf_isencao && baseCalculo <= irrf_isencao_break_even) {
    const lastBracket = irrf_brackets[irrf_brackets.length - 1]
    const cMax = irrf_isencao * lastBracket.rate - lastBracket.deduction
    const complemento = cMax * (irrf_isencao_break_even - baseCalculo) / (irrf_isencao_break_even - irrf_isencao)
    return money(Math.max(0, irrfNormal - complemento))
  }

  return money(irrfNormal)
}

/**
 * Calcula o IRRF com alíquotas progressivas
 * Base de cálculo: salário bruto - INSS - dedução por dependentes
 *
 * A partir de 2026, há isenção total para rendimentos tributáveis até R$ 5.000,00/mês
 * e complemento de isenção gradual até R$ 7.786,72/mês (Lei nº 15.270/2025).
 *
 * @param salarioBruto - Salário bruto
 * @param inss - Valor do INSS já calculado
 * @param dependentes - Número de dependentes (padrão: 0)
 * @returns Valor do desconto de IRRF
 */
export function calcularIRRF(salarioBruto: number, inss: number, dependentes: number = 0): number {
  const { deducao_dependente } = getTaxConfigSync()
  const deducaoDependentes = money(dependentes * deducao_dependente)
  const baseCalculo = salarioBruto - inss - deducaoDependentes
  return calcularIRRFSobreBase(baseCalculo)
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
 * Anexos do Simples Nacional
 * Anexo III: Serviços (contabilidade, medicina, laboratórios, etc.)
 * Anexo V: Serviços profissionais (tecnologia, publicidade, etc.)
 */
export type SimplesNacionalAnexo = 'III' | 'V'

/**
 * Calcula o DAS (Documento de Arrecadação do Simples Nacional)
 * Baseado no faturamento mensal e anexo do Simples Nacional
 * 
 * @param faturamentoMensal - Faturamento mensal bruto
 * @param anexo - Anexo do Simples Nacional (III ou V)
 * @param faturamentoAnualAcumulado - Faturamento anual acumulado nos últimos 12 meses (opcional, padrão: mensal * 12)
 * @returns Valor do DAS a pagar
 */
export function calcularDASSimplesNacional(
  faturamentoMensal: number,
  anexo: SimplesNacionalAnexo = 'III',
  faturamentoAnualAcumulado?: number
): number {
  if (faturamentoMensal <= 0) return 0

  const { das_anexo_iii, das_anexo_v } = getTaxConfigSync()
  const faturamentoAnual = faturamentoAnualAcumulado ?? faturamentoMensal * 12
  const tabela = anexo === 'III' ? das_anexo_iii : das_anexo_v

  for (const faixa of tabela) {
    if (faturamentoAnual <= faixa.limiteAnual) {
      const das = faturamentoMensal * faixa.aliquota - faixa.deducao / 12
      return money(Math.max(0, das))
    }
  }

  const ultimaFaixa = tabela[tabela.length - 1]
  const das = faturamentoMensal * ultimaFaixa.aliquota - ultimaFaixa.deducao / 12
  return money(Math.max(0, das))
}

/**
 * Calcula o INSS sobre pró-labore (remuneração do sócio)
 * Alíquota: 11% sobre o pró-labore, respeitando o teto previdenciário
 * 
 * @param proLabore - Valor do pró-labore mensal
 * @returns Valor do INSS sobre pró-labore
 */
export function calcularINSSProLabore(proLabore: number): number {
  if (proLabore <= 0) return 0

  const { inss_brackets, inss_pro_labore_rate } = getTaxConfigSync()
  const tetoINSS = inss_brackets[inss_brackets.length - 1].limit

  const baseCalculo = Math.min(proLabore, tetoINSS)
  return money(baseCalculo * inss_pro_labore_rate)
}

/**
 * Calcula o IRRF sobre pró-labore (remuneração do sócio)
 * Usa a mesma tabela progressiva do IRRF de CLT, incluindo o complemento de isenção 2026.
 * Base de cálculo: pró-labore - INSS sobre pró-labore
 *
 * @param proLabore - Valor do pró-labore mensal
 * @param inssProLabore - Valor do INSS sobre pró-labore já calculado
 * @returns Valor do IRRF sobre pró-labore
 */
export function calcularIRRFProLabore(proLabore: number, inssProLabore: number): number {
  const baseCalculo = proLabore - inssProLabore
  return calcularIRRFSobreBase(baseCalculo)
}

/**
 * Calcula todos os descontos de PJ de forma realista
 * Considera: DAS (Simples Nacional), INSS sobre pró-labore e IRRF sobre pró-labore
 * 
 * @param faturamentoBruto - Faturamento bruto mensal (salário base + bônus + adicionais)
 * @param proLabore - Valor do pró-labore mensal (remuneração do sócio)
 * @param anexo - Anexo do Simples Nacional (III ou V), padrão: III
 * @param faturamentoAnualAcumulado - Faturamento anual acumulado (opcional)
 * @returns Objeto com todos os descontos de PJ
 */
export function calcularDescontosPJ(
  faturamentoBruto: number,
  proLabore: number,
  anexo: SimplesNacionalAnexo = 'III',
  faturamentoAnualAcumulado?: number
): {
  das: number // DAS (Simples Nacional)
  inssProLabore: number // INSS sobre pró-labore
  irrfProLabore: number // IRRF sobre pró-labore
  total: number
} {
  const das = calcularDASSimplesNacional(faturamentoBruto, anexo, faturamentoAnualAcumulado)
  const inssProLabore = calcularINSSProLabore(proLabore)
  const irrfProLabore = calcularIRRFProLabore(proLabore, inssProLabore)

  return {
    das,
    inssProLabore,
    irrfProLabore,
    total: money(das + inssProLabore + irrfProLabore),
  }
}
