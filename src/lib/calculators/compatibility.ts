/**
 * Motor de compatibilidade salarial com custo de vida.
 * Responde: "Esse salário sustenta a vida que eu tenho ou quero ter?"
 *
 * Compoem o resultado do simulateMonthly com benefícios e custo de vida.
 */

import { simulateMonthly } from './monthly'
import { money } from './utils'
import type {
  SalaryFitInput,
  SalaryFitResult,
  LifeCostInput,
  CompatibilityStatus,
} from './compatibility-types'
import type { MonthlySimulationInput } from './types'

function sumLifeCost(lc: LifeCostInput): number {
  return money(
    lc.moradia +
      lc.contasFixas +
      lc.alimentacao +
      lc.transporte +
      lc.saude +
      lc.educacao +
      lc.dividas +
      lc.dependentes +
      lc.lazer +
      lc.outros
  )
}

function classifyStatus(balance: number, reserve: number): CompatibilityStatus {
  if (balance >= reserve * 1.5) return 'confortavel'
  if (balance >= reserve) return 'viavel'
  if (balance > 0) return 'apertado'
  return 'inviavel'
}

function getRiskLevel(status: CompatibilityStatus): SalaryFitResult['riskLevel'] {
  switch (status) {
    case 'confortavel':
      return 'baixo'
    case 'viavel':
      return 'medio'
    case 'apertado':
      return 'alto'
    case 'inviavel':
      return 'critico'
  }
}

function generateInsights(
  compatibilityBalance: number,
  compatibilityStatus: CompatibilityStatus,
  _availableIncome: number,
  _monthlyLifeCost: number,
  benefitsNetValue: number,
  hasBenefits: boolean
): string[] {
  const insights: string[] = []

  if (compatibilityStatus === 'inviavel') {
    insights.push('Essa proposta não cobre seus custos mensais informados.')
    insights.push(`Faltam ${money(-compatibilityBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para fechar as contas.`)
  } else if (compatibilityStatus === 'apertado') {
    insights.push('Com essa proposta, você cobre seus custos, mas a margem mensal fica baixa.')
    insights.push('Qualquer imprevisto pode gerar aperto financeiro.')
  } else if (compatibilityStatus === 'viavel') {
    insights.push('A proposta paga as contas e mantém sua reserva desejada.')
    insights.push('Sobra um valor moderado após as despesas.')
  } else {
    insights.push('A proposta é confortável para seu custo de vida atual.')
    insights.push(`Sobra ${money(compatibilityBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} após custos e reserva.`)
  }

  if (hasBenefits && benefitsNetValue > 0) {
    insights.push(
      `Benefícios somam ${money(benefitsNetValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês, aliviando despesas.`
    )
  }

  return insights
}

/**
 * Simula a compatibilidade entre proposta salarial e custo de vida.
 * Reaproveita simulateMonthly e adiciona camada de benefícios + custo de vida.
 */
export function simulateSalaryFit(input: SalaryFitInput): SalaryFitResult {
  const base: Omit<MonthlySimulationInput, 'contractType'> = {
    salarioBase: input.grossCompensation,
    jornadaMensalHoras: input.jornadaMensalHoras ?? 220,
    horas50: input.horas50 ?? 0,
    horas100: input.horas100 ?? 0,
    horas150: input.horas150 ?? 0,
    atrasosHoras: 0,
    adicionaisPercentual: 0,
    dependentes: input.dependentes ?? 0,
  }

  const monthly = simulateMonthly({
    ...base,
    contractType: input.contractType,
    proLabore: input.proLabore,
    anexoSimplesNacional: input.anexoSimplesNacional,
    faturamentoAnualAcumulado: input.faturamentoAnualAcumulado,
  })

  const benefits = input.benefits ?? []
  const benefitsNetValue = money(
    benefits.filter((b) => b.includeInComparison).reduce((sum, b) => sum + b.netValue, 0)
  )
  const benefitsGrossValue = money(
    benefits.filter((b) => b.includeInComparison).reduce((sum, b) => sum + b.monthlyValue, 0)
  )

  const availableIncome = money(monthly.liquido + benefitsNetValue)

  const monthlyLifeCost = sumLifeCost(input.lifeCost)
  const essentialCost = money(
    input.lifeCost.moradia +
      input.lifeCost.contasFixas +
      input.lifeCost.alimentacao +
      input.lifeCost.transporte +
      input.lifeCost.saude +
      input.lifeCost.dividas +
      input.lifeCost.dependentes
  )
  const desiredReserve = input.lifeCost.reservaDesejada

  const compatibilityBalance = money(availableIncome - monthlyLifeCost)
  const compatibilityStatus = classifyStatus(compatibilityBalance, desiredReserve)
  const riskLevel = getRiskLevel(compatibilityStatus)

  const insights = generateInsights(
    compatibilityBalance,
    compatibilityStatus,
    availableIncome,
    monthlyLifeCost,
    benefitsNetValue,
    benefits.length > 0
  )

  return {
    grossCompensation: monthly.bruto,
    mandatoryDeductions: monthly.descontos,
    netIncome: monthly.liquido,
    benefitsGrossValue,
    benefitsNetValue,
    availableIncome,
    monthlyLifeCost,
    essentialCost,
    desiredReserve,
    compatibilityBalance,
    compatibilityStatus,
    riskLevel,
    insights,
    netBreakdown: monthly.items,
  }
}
