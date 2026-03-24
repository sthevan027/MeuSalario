import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { consumeCompatibilityQuota } from '@/lib/simulation-quota'
import { simulateSalaryFit } from '@/lib/calculators/compatibility'
import type { SalaryFitInput, BenefitItem, LifeCostInput } from '@/lib/calculators/compatibility-types'

/**
 * POST /api/compatibility
 *
 * Consome 1 cota de compatibilidade (FREE) e retorna a análise de
 * compatibilidade salarial. Não persiste no histórico (mesma lógica da
 * server action reserveCompatibilityAnalysis).
 */

const lifeCostSchema = z.object({
  moradia: z.number().default(0),
  contasFixas: z.number().default(0),
  alimentacao: z.number().default(0),
  transporte: z.number().default(0),
  saude: z.number().default(0),
  educacao: z.number().default(0),
  dividas: z.number().default(0),
  dependentes: z.number().default(0),
  lazer: z.number().default(0),
  reservaDesejada: z.number().default(0),
  outros: z.number().default(0),
})

const benefitItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  monthlyValue: z.number(),
  employeeDiscount: z.number().optional(),
  netValue: z.number(),
  includeInComparison: z.boolean().default(true),
})

const compatBodySchema = z.object({
  contractType: z.enum(['clt', 'pj']),
  grossCompensation: z.number().positive(),
  dependentes: z.number().int().min(0).optional(),
  proLabore: z.number().positive().optional(),
  anexoSimplesNacional: z.enum(['III', 'V']).optional(),
  faturamentoAnualAcumulado: z.number().optional(),
  benefits: z.array(benefitItemSchema).optional(),
  lifeCost: lifeCostSchema,
  jornadaMensalHoras: z.number().optional(),
  horas50: z.number().optional(),
  horas100: z.number().optional(),
  horas150: z.number().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let body: z.infer<typeof compatBodySchema>
  try {
    const raw = await request.json()
    body = compatBodySchema.parse(raw)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos.', details: e.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  // Consome cota antes de calcular
  const quotaResult = await consumeCompatibilityQuota(supabase)
  if (!quotaResult.ok) {
    const status = quotaResult.code === 'QUOTA_EXCEEDED' ? 403 : 400
    return NextResponse.json(
      { error: quotaResult.message, code: quotaResult.code },
      { status }
    )
  }

  const input: SalaryFitInput = {
    contractType: body.contractType,
    grossCompensation: body.grossCompensation,
    dependentes: body.dependentes,
    proLabore: body.proLabore,
    anexoSimplesNacional: body.anexoSimplesNacional,
    faturamentoAnualAcumulado: body.faturamentoAnualAcumulado,
    benefits: body.benefits as BenefitItem[] | undefined,
    lifeCost: body.lifeCost as LifeCostInput,
    jornadaMensalHoras: body.jornadaMensalHoras,
    horas50: body.horas50,
    horas100: body.horas100,
    horas150: body.horas150,
  }

  const result = simulateSalaryFit(input)

  return NextResponse.json({
    ok: true,
    result,
    compatibility_remaining: quotaResult.unlimited ? null : quotaResult.remaining,
    unlimited: quotaResult.unlimited,
  })
}
