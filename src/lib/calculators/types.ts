export type ContractType = 'clt' | 'pj'

/**
 * Anexo do Simples Nacional
 * III: Serviços (contabilidade, medicina, laboratórios, etc.)
 * V: Serviços profissionais (tecnologia, publicidade, etc.)
 */
export type SimplesNacionalAnexo = 'III' | 'V'

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
   * @deprecated Use proLabore e anexoSimplesNacional para cálculo real de impostos PJ
   * Percentual de descontos "genérico" (ex.: custos/impostos do PJ).
   * Para CLT os descontos são automáticos (INSS + IRRF progressivos), então este campo pode ser omitido.
   * Para PJ, se proLabore e anexoSimplesNacional forem fornecidos, este campo será ignorado.
   */
  descontosPercentual?: number
  /**
   * PJ: Pró-labore (remuneração do sócio). Se fornecido, será usado para calcular INSS e IRRF sobre pró-labore.
   * Se não fornecido, será estimado como 30% do faturamento bruto.
   */
  proLabore?: number
  /**
   * PJ: Anexo do Simples Nacional (III ou V). Padrão: III
   * III: Serviços (contabilidade, medicina, laboratórios, etc.) - alíquota inicial ~6%
   * V: Serviços profissionais (tecnologia, publicidade, etc.) - alíquota inicial ~15,5%
   */
  anexoSimplesNacional?: SimplesNacionalAnexo
  /**
   * PJ: Faturamento anual acumulado nos últimos 12 meses (opcional).
   * Se não fornecido, será estimado como faturamento mensal * 12.
   */
  faturamentoAnualAcumulado?: number
  adiantamentoDia?: 15 | 20 // CLT: dia do adiantamento, PJ: não usado
  month?: number // Mês da simulação (1-12), padrão: mês atual
  year?: number // Ano da simulação, padrão: ano atual
  /**
   * CLT: Número de dependentes para cálculo de IRRF (reduz base de cálculo em R$ 189,59 por dependente)
   * Padrão: 0
   */
  dependentes?: number
}

export type MonthlySimulationResult = {
  bruto: number
  adicionais: number
  horasExtras: number // Para CLT: horas extras, para PJ: bônus (mantém compatibilidade)
  atrasos: number
  inss: number
  irrf: number
  descontos: number
  // PJ: campos adicionais
  das?: number // DAS (Simples Nacional) - apenas para PJ
  inssProLabore?: number // INSS sobre pró-labore - apenas para PJ
  irrfProLabore?: number // IRRF sobre pró-labore - apenas para PJ
  /**
   * PJ (apenas em comparações CLT × PJ):
   * Faturamento bruto PJ estimado necessário para igualar o líquido CLT.
   */
  pjBrutoEquivalenteCltLiquido?: number
  liquido: number
  adiantamentoPercentual: number
  adiantamentoDia?: 15 | 20 // Opcional: só existe para CLT
  adiantamento: number
  saldoPagamento: number
  items: BreakdownItem[]
}

export type TerminationInput = {
  salarioBase: number
  mesesTrabalhadosNoAno: number // Meses trabalhados no ano atual (0-12) - usado para 13º proporcional
  mesesPeriodoAquisitivo?: number // Meses desde o último período de férias (para férias proporcionais). Se não informado, usa mesesTrabalhadosNoAno
  avisoPrevioDias: number
  feriasVencidas: boolean
  saldoFgtsMesesEstimado: number
  /**
   * Dias trabalhados no mês da rescisão (para cálculo de saldo de salário)
   * Se não informado, será estimado como 15 dias
   */
  diasTrabalhadosNoMes?: number
  /**
   * Tipo de rescisão:
   * - 'sem_justa_causa': Demissão sem justa causa (multa FGTS 40%)
   * - 'acordo': Acordo entre as partes (multa FGTS 20%)
   * - 'pedido_demissao': Pedido de demissão (sem multa FGTS)
   * - 'justa_causa': Demissão por justa causa (sem multa FGTS)
   */
  tipoRescisao?: 'sem_justa_causa' | 'acordo' | 'pedido_demissao' | 'justa_causa'
}

export type TerminationResult = {
  total: number // Total líquido (valor que o trabalhador recebe)
  totalBruto?: number // Total bruto (antes dos descontos)
  totalDescontos?: number // Total de descontos (INSS + IRRF)
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
  /**
   * CLT: Número de dependentes para cálculo de IRRF (reduz base de cálculo em R$ 189,59 por dependente)
   * Padrão: 0
   */
  dependentes?: number
  /**
   * PJ: Pró-labore (remuneração do sócio). Se fornecido junto com anexoSimplesNacional, será usado cálculo real.
   * Se não fornecido, será usado percentual genérico (descontosPjPercentual).
   */
  proLabore?: number
  /**
   * PJ: Anexo do Simples Nacional (III ou V). Se fornecido junto com proLabore, será usado cálculo real.
   */
  anexoSimplesNacional?: SimplesNacionalAnexo
  /**
   * PJ: Faturamento anual acumulado nos últimos 12 meses (opcional, para cálculo real).
   */
  faturamentoAnualAcumulado?: number
  /**
   * @deprecated Use proLabore e anexoSimplesNacional para cálculo real de impostos PJ
   * PJ: Percentual genérico de descontos (usado apenas se proLabore e anexoSimplesNacional não forem fornecidos)
   * Padrão: 10%
   */
  descontosPjPercentual?: number
}

export type CompareResult = {
  clt: MonthlySimulationResult
  pj: MonthlySimulationResult
  deltaLiquido: number
}

export type ThirteenthInput = {
  salarioBase: number
  mesesTrabalhados: number // Meses trabalhados no ano (1-12)
  dependentes?: number
  recebeuPrimeiraParcela?: boolean // Se já recebeu a 1ª parcela
}

export type ThirteenthResult = {
  valorBase: number
  primeiraParcela: number
  segundaParcelaBase: number
  segundaParcelaLiquida: number
  inss: number
  irrf: number
  descontosSegundaParcela: number
  totalLiquido: number
  items: BreakdownItem[]
}

export type VacationInput = {
  salarioBase: number
  mesesTrabalhados: number // Meses trabalhados desde último período aquisitivo (0-12)
  temFeriasVencidas?: boolean // Se tem férias vencidas (período completo)
  dependentes?: number
}

export type VacationResult = {
  feriasVencidas: number
  feriasProporcionais: number
  totalBruto: number
  inss: number
  irrf: number
  descontos: number
  totalLiquido: number
  items: BreakdownItem[]
}

