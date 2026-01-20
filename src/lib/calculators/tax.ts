import { money } from './utils'

/**
 * Tabela de INSS 2026 (CLT)
 * Alíquotas progressivas por faixa salarial
 * Válida a partir de 1º de janeiro de 2026
 */
const INSS_BRACKETS = [
  { limit: 1621.0, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
] as const

const INSS_MAX = 988.10 // Teto do INSS (14% de R$ 8.475,55) - valor aproximado de R$ 988,10

/**
 * Tabela de IRRF 2026
 * Alíquotas progressivas por faixa salarial (base de cálculo: bruto - INSS)
 * A mesma tabela é usada para CLT e pró-labore (PJ), pois pró-labore é tributado como rendimento de pessoa física
 * 
 * Nota: A partir de 2026, há isenção total para rendimentos tributáveis até R$ 5.000,00/mês
 * (Lei nº 15.270/2025 - Reforma da Renda). Isso é aplicado na função calcularIRRF.
 */
const IRRF_BRACKETS = [
  { limit: 2428.80, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
] as const

/**
 * Isenção total de IRRF para rendimentos até R$ 5.000,00/mês (Lei nº 15.270/2025)
 * Aplicada a partir de 2026
 */
const IRRF_ISENCAO_2026 = 5000.0

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
 * Dedução por dependente no IRRF (2026)
 */
const DEDUCAO_DEPENDENTE_2026 = 189.59

/**
 * Calcula o IRRF com alíquotas progressivas
 * Base de cálculo: salário bruto - INSS - dedução por dependentes
 * 
 * A partir de 2026, há isenção total para rendimentos tributáveis até R$ 5.000,00/mês
 * (Lei nº 15.270/2025 - Reforma da Renda)
 * 
 * @param salarioBruto - Salário bruto
 * @param inss - Valor do INSS já calculado
 * @param dependentes - Número de dependentes (padrão: 0)
 * @returns Valor do desconto de IRRF
 */
export function calcularIRRF(salarioBruto: number, inss: number, dependentes: number = 0): number {
  const deducaoDependentes = money(dependentes * DEDUCAO_DEPENDENTE_2026)
  const baseCalculo = salarioBruto - inss - deducaoDependentes

  if (baseCalculo <= 0) return 0

  // Isenção total para rendimentos até R$ 5.000,00/mês (2026)
  if (baseCalculo <= IRRF_ISENCAO_2026) {
    return 0
  }

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
 * Anexos do Simples Nacional
 * Anexo III: Serviços (contabilidade, medicina, laboratórios, etc.)
 * Anexo V: Serviços profissionais (tecnologia, publicidade, etc.)
 */
export type SimplesNacionalAnexo = 'III' | 'V'

/**
 * Tabela do Simples Nacional - Anexo III (Serviços)
 * Alíquotas progressivas baseadas no faturamento anual acumulado
 */
const SIMPLES_ANEXO_III = [
  { limiteAnual: 180_000, aliquota: 0.06, deducao: 0 },
  { limiteAnual: 360_000, aliquota: 0.112, deducao: 9_360 },
  { limiteAnual: 720_000, aliquota: 0.135, deducao: 17_640 },
  { limiteAnual: 1_800_000, aliquota: 0.16, deducao: 35_640 },
  { limiteAnual: 3_600_000, aliquota: 0.21, deducao: 125_640 },
  { limiteAnual: 4_800_000, aliquota: 0.33, deducao: 648_000 },
] as const

/**
 * Tabela do Simples Nacional - Anexo V (Serviços profissionais)
 * Alíquotas progressivas baseadas no faturamento anual acumulado
 */
const SIMPLES_ANEXO_V = [
  { limiteAnual: 180_000, aliquota: 0.155, deducao: 0 },
  { limiteAnual: 360_000, aliquota: 0.18, deducao: 4_500 },
  { limiteAnual: 720_000, aliquota: 0.195, deducao: 9_900 },
  { limiteAnual: 1_800_000, aliquota: 0.205, deducao: 17_100 },
  { limiteAnual: 3_600_000, aliquota: 0.23, deducao: 62_100 },
  { limiteAnual: 4_800_000, aliquota: 0.305, deducao: 540_000 },
] as const

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

  // Se não informado, estima o faturamento anual como mensal * 12
  const faturamentoAnual = faturamentoAnualAcumulado ?? faturamentoMensal * 12

  const tabela = anexo === 'III' ? SIMPLES_ANEXO_III : SIMPLES_ANEXO_V

  // Encontra a faixa correspondente ao faturamento anual
  for (let i = 0; i < tabela.length; i++) {
    const faixa = tabela[i]
    if (faturamentoAnual <= faixa.limiteAnual) {
      // Fórmula: (faturamentoMensal * aliquota) - (deducao / 12)
      const das = faturamentoMensal * faixa.aliquota - faixa.deducao / 12
      return money(Math.max(0, das))
    }
  }

  // Se ultrapassar todas as faixas, usa a última (teto)
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

  // Teto do INSS em 2026: R$ 8.475,55
  const TETO_INSS_2026 = 8475.55
  const ALIQUOTA_INSS_PRO_LABORE = 0.11

  const baseCalculo = Math.min(proLabore, TETO_INSS_2026)
  const inss = baseCalculo * ALIQUOTA_INSS_PRO_LABORE

  return money(inss)
}

/**
 * Calcula o IRRF sobre pró-labore (remuneração do sócio)
 * Usa a mesma tabela progressiva do IRRF de CLT, pois pró-labore é tributado como rendimento de pessoa física
 * Base de cálculo: pró-labore - INSS sobre pró-labore
 * 
 * A partir de 2026, há isenção total para rendimentos tributáveis até R$ 5.000,00/mês
 * (Lei nº 15.270/2025 - Reforma da Renda)
 * 
 * @param proLabore - Valor do pró-labore mensal
 * @param inssProLabore - Valor do INSS sobre pró-labore já calculado
 * @returns Valor do IRRF sobre pró-labore
 */
export function calcularIRRFProLabore(proLabore: number, inssProLabore: number): number {
  const baseCalculo = proLabore - inssProLabore

  if (baseCalculo <= 0) return 0

  // Isenção total para rendimentos até R$ 5.000,00/mês (2026)
  if (baseCalculo <= IRRF_ISENCAO_2026) {
    return 0
  }

  // Usa a mesma tabela de IRRF do CLT (correto, pois pró-labore é rendimento de pessoa física)
  for (const bracket of IRRF_BRACKETS) {
    if (baseCalculo <= bracket.limit) {
      const irrf = baseCalculo * bracket.rate - bracket.deduction
      return money(Math.max(0, irrf))
    }
  }

  return 0
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
