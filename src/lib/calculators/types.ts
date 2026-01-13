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
  horas50: number
  horas100: number
  horas150: number
  atrasosHoras: number
  adicionaisPercentual: number
  descontosPercentual: number
  adiantamentoDia?: 15 | 20
}

export type MonthlySimulationResult = {
  bruto: number
  adicionais: number
  horasExtras: number
  atrasos: number
  descontos: number
  liquido: number
  adiantamentoPercentual: number
  adiantamentoDia: 15 | 20
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

