import { z } from 'zod'

export const contractTypeSchema = z.enum(['clt', 'pj'])

export const monthlyInputSchema = z.object({
  contractType: contractTypeSchema,
  salarioBase: z.number().nonnegative(),
  jornadaMensalHoras: z.number().positive(),
  horas50: z.number().nonnegative(),
  horas100: z.number().nonnegative(),
  horas150: z.number().nonnegative(),
  atrasosHoras: z.number().nonnegative(),
  adicionaisPercentual: z.number().nonnegative(),
  // Para CLT é automático (INSS + IRRF). Para PJ pode ser estimado via percentual.
  descontosPercentual: z.number().min(0).max(100).optional(),
})

export const terminationInputSchema = z.object({
  salarioBase: z.number().nonnegative(),
  mesesTrabalhadosNoAno: z.number().min(0).max(12),
  avisoPrevioDias: z.number().min(0).max(90),
  feriasVencidas: z.boolean(),
  saldoFgtsMesesEstimado: z.number().min(0).max(600),
})

export const compareInputSchema = z.object({
  salarioBase: z.number().nonnegative(),
  jornadaMensalHoras: z.number().positive(),
  horas50: z.number().nonnegative(),
  horas100: z.number().nonnegative(),
  horas150: z.number().nonnegative(),
  atrasosHoras: z.number().nonnegative(),
  adicionaisPercentual: z.number().nonnegative(),
  dependentes: z.number().min(0).max(20).optional(),
  proLabore: z.number().nonnegative().optional(),
  anexoSimplesNacional: z.enum(['III', 'V']).optional(),
  faturamentoAnualAcumulado: z.number().nonnegative().optional(),
  descontosPjPercentual: z.number().min(0).max(100).optional(),
})

export type MonthlyInput = z.infer<typeof monthlyInputSchema>
export type TerminationInput = z.infer<typeof terminationInputSchema>
export type CompareInput = z.infer<typeof compareInputSchema>

