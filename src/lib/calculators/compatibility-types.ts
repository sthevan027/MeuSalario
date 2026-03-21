/**
 * Tipos para a funcionalidade de compatibilidade salarial com custo de vida.
 * Baseado no planejamento em Docs/planejamento-compatibilidade-salarial.md
 */

import type { ContractType } from './types'

export type BenefitType =
  | 'vr'
  | 'va'
  | 'vt'
  | 'mobilidade'
  | 'home_office'
  | 'plano_saude'
  | 'bonus'
  | 'outro'

export type ExpenseCategory = 'alimentacao' | 'transporte' | 'saude' | 'geral'

export type BenefitItem = {
  id: string
  type: BenefitType
  label: string
  monthlyValue: number
  employeeDiscount?: number
  netValue: number
  affectsExpenseCategory?: ExpenseCategory
  includeInComparison: boolean
}

export type LifeCostInput = {
  moradia: number
  contasFixas: number
  alimentacao: number
  transporte: number
  saude: number
  educacao: number
  dividas: number
  dependentes: number
  lazer: number
  reservaDesejada: number
  outros: number
}

export type CompatibilityStatus = 'confortavel' | 'viavel' | 'apertado' | 'inviavel'

export type SalaryFitInput = {
  contractType: ContractType
  /** Salário bruto CLT ou faturamento mensal PJ */
  grossCompensation: number
  /** Dependentes (CLT) - reduz base IRRF */
  dependentes?: number
  /** PJ: pró-labore */
  proLabore?: number
  /** PJ: anexo Simples */
  anexoSimplesNacional?: 'III' | 'V'
  /** PJ: faturamento anual acumulado */
  faturamentoAnualAcumulado?: number
  /** Benefícios mensais */
  benefits?: BenefitItem[]
  /** Custos de vida mensais */
  lifeCost: LifeCostInput
  /** CLT: jornada mensal horas (default 220) */
  jornadaMensalHoras?: number
  /** CLT: horas extras 50% */
  horas50?: number
  /** CLT: horas extras 100% */
  horas100?: number
  /** CLT: horas extras 150% */
  horas150?: number
}

export type SalaryFitResult = {
  grossCompensation: number
  mandatoryDeductions: number
  netIncome: number
  benefitsGrossValue: number
  benefitsNetValue: number
  /** Renda disponível = líquido + benefícios líquidos */
  availableIncome: number
  monthlyLifeCost: number
  essentialCost: number
  desiredReserve: number
  compatibilityBalance: number
  compatibilityStatus: CompatibilityStatus
  riskLevel: 'baixo' | 'medio' | 'alto' | 'critico'
  insights: string[]
  /** Breakdown do líquido (do motor mensal) */
  netBreakdown: Array<{ key: string; label: string; amount: number; kind: 'earning' | 'deduction' | 'info' }>
}

export const EMPTY_LIFE_COST: LifeCostInput = {
  moradia: 0,
  contasFixas: 0,
  alimentacao: 0,
  transporte: 0,
  saude: 0,
  educacao: 0,
  dividas: 0,
  dependentes: 0,
  lazer: 0,
  reservaDesejada: 0,
  outros: 0,
}
