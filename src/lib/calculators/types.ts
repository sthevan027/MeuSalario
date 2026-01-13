export type ContractType = 'clt' | 'pj'

export type BreakdownItem = {
  key: string
  label: string
  amount: number
  kind: 'earning' | 'deduction' | 'info'
}

export type MonthlySimulationInput = {
  contractType: ContractType
  salarioBase: number
  jornadaMensalHoras: number
  horas50: number // CLT: horas extras 50%, PJ: não usado
  horas100: number // CLT: horas extras 100%, PJ: não usado
  horas150: number // CLT: horas extras 150%, PJ: não usado
  bonus?: number // PJ: bônus (valor fixo), CLT: não usado
  atrasosHoras: number
  adicionaisPercentual: number
  /**
   * Percentual de descontos "genérico" (ex.: custos/impostos do PJ).
   * Para CLT os descontos são automáticos (INSS + IRRF progressivos), então este campo pode ser omitido.
   */
  descontosPercentual?: number
  adiantamentoDia?: 15 | 20 // CLT: dia do adiantamento, PJ: não usado
}

export type MonthlySimulationResult = {
  bruto: number
  adicionais: number
  horasExtras: number // Para CLT: horas extras, para PJ: bônus (mantém compatibilidade)
  atrasos: number
  inss: number
  irrf: number
  descontos: number
  liquido: number
  adiantamentoPercentual: number
  adiantamentoDia?: 15 | 20 // Opcional: só existe para CLT
  adiantamento: number
  saldoPagamento: number
  items: BreakdownItem[]
}

export type TerminationInput = {
  salarioBase: number
  mesesTrabalhadosNoAno: number
  avisoPrevioDias: number
  feriasVencidas: boolean
  saldoFgtsMesesEstimado: number
}

export type TerminationResult = {
  total: number
  items: BreakdownItem[]
}

export type CompareInput = {
  salarioBase: number
  jornadaMensalHoras: number
  horas50: number
  horas100: number
  horas150: number
  atrasosHoras: number
  adicionaisPercentual: number
  descontosCltPercentual: number
  descontosPjPercentual: number
}

export type CompareResult = {
  clt: MonthlySimulationResult
  pj: MonthlySimulationResult
  deltaLiquido: number
}

