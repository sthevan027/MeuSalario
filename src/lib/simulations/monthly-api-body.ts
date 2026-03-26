import { z } from 'zod'
import type { MonthlySimulationInput } from '@/lib/calculators/types'
import { toNumberOr } from '@/lib/number'

const monthlySimBodySchema = z.object({
  contractType: z.enum(['clt', 'pj']).optional(),
  salarioBase: z.union([z.number(), z.string()]),
  jornadaMensalHoras: z.union([z.number(), z.string()]).optional(),
  horas50: z.union([z.number(), z.string()]).optional(),
  horas100: z.union([z.number(), z.string()]).optional(),
  horas150: z.union([z.number(), z.string()]).optional(),
  bonus: z.union([z.number(), z.string()]).optional(),
  atrasosHoras: z.union([z.number(), z.string()]).optional(),
  adicionaisPercentual: z.union([z.number(), z.string()]).optional(),
  proLabore: z.union([z.number(), z.string()]).optional(),
  anexoSimplesNacional: z.enum(['III', 'V']).optional(),
  dependentes: z.union([z.number(), z.string()]).optional(),
  adiantamentoDia: z.union([z.literal(15), z.literal(20)]).optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
})

function num(v: unknown, fallback = 0) {
  if (typeof v === 'number') return v
  return toNumberOr(v, fallback)
}

export function parseMonthlySimulationBody(raw: unknown): MonthlySimulationInput {
  const body = monthlySimBodySchema.parse(raw)
  const contractType = body.contractType ?? 'clt'
  const adiantamentoDia =
    contractType === 'clt' ? (num(body.adiantamentoDia, 15) === 20 ? 20 : 15) : undefined

  const proLaboreStr = body.proLabore
  const anexoStr = body.anexoSimplesNacional
  const usaCalculoRealPJ = contractType === 'pj' && proLaboreStr != null && anexoStr != null

  return {
    contractType,
    salarioBase: num(body.salarioBase),
    jornadaMensalHoras: num(body.jornadaMensalHoras, 220),
    horas50: contractType === 'clt' ? num(body.horas50) : 0,
    horas100: contractType === 'clt' ? num(body.horas100) : 0,
    horas150: contractType === 'clt' ? num(body.horas150) : 0,
    bonus: contractType === 'pj' ? num(body.bonus) : undefined,
    atrasosHoras: num(body.atrasosHoras),
    adicionaisPercentual: num(body.adicionaisPercentual),
    descontosPercentual: undefined,
    proLabore: usaCalculoRealPJ ? num(proLaboreStr) : undefined,
    anexoSimplesNacional: usaCalculoRealPJ ? (anexoStr === 'V' ? 'V' : 'III') : undefined,
    dependentes: contractType === 'clt' ? num(body.dependentes, 0) : undefined,
    adiantamentoDia,
    month: body.month,
    year: body.year,
  }
}
