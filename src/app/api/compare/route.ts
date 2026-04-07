import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { persistWithComparisonQuota } from '@/lib/simulation-quota'
import { compareCltVsPj } from '@/lib/calculators/compare'
import type { CompareInput } from '@/lib/calculators/types'
import { toNumberOr } from '@/lib/number'

/**
 * POST /api/compare
 *
 * Executa a comparação CLT × PJ, consome 1 cota de comparação (FREE) e
 * salva os dois lados no histórico (uma linha CLT e uma PJ).
 *
 * Corpo JSON: mesmos campos do CompareInput do formulário.
 */

const compareBodySchema = z.object({
  salarioBase: z.union([z.number(), z.string()]),
  jornadaMensalHoras: z.union([z.number(), z.string()]).optional(),
  horas50: z.union([z.number(), z.string()]).optional(),
  horas100: z.union([z.number(), z.string()]).optional(),
  horas150: z.union([z.number(), z.string()]).optional(),
  atrasosHoras: z.union([z.number(), z.string()]).optional(),
  adicionaisPercentual: z.union([z.number(), z.string()]).optional(),
  dependentes: z.union([z.number(), z.string()]).optional(),
  proLabore: z.union([z.number(), z.string()]).optional(),
  anexoSimplesNacional: z.enum(['III', 'V']).optional(),
  faturamentoAnualAcumulado: z.union([z.number(), z.string()]).optional(),
  descontosPjPercentual: z.union([z.number(), z.string()]).optional(),
})

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return v
  return toNumberOr(v, fallback)
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let body: z.infer<typeof compareBodySchema>
  try {
    const raw = await request.json()
    body = compareBodySchema.parse(raw)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos.', details: e.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const usaCalculoRealPJ = body.proLabore != null && body.anexoSimplesNacional != null

  const input: CompareInput = {
    salarioBase: num(body.salarioBase),
    jornadaMensalHoras: num(body.jornadaMensalHoras, 220),
    horas50: num(body.horas50),
    horas100: num(body.horas100),
    horas150: num(body.horas150),
    atrasosHoras: num(body.atrasosHoras),
    adicionaisPercentual: num(body.adicionaisPercentual),
    dependentes: num(body.dependentes),
    proLabore: usaCalculoRealPJ ? num(body.proLabore) : undefined,
    anexoSimplesNacional: usaCalculoRealPJ ? body.anexoSimplesNacional : undefined,
    faturamentoAnualAcumulado: usaCalculoRealPJ
      ? num(body.faturamentoAnualAcumulado)
      : undefined,
    descontosPjPercentual: !usaCalculoRealPJ ? num(body.descontosPjPercentual, 10) : undefined,
  }

  const result = compareCltVsPj(input)

  const quotaResult = await persistWithComparisonQuota(supabase, user.id, async () => {
    const { error } = await supabase.from('simulations').insert([
      {
        user_id: user.id,
        contract_type: 'clt',
        input_json: { kind: 'compare', side: 'clt', ...input },
        result_json: result.clt,
      },
      {
        user_id: user.id,
        contract_type: 'pj',
        input_json: { kind: 'compare', side: 'pj', ...input },
        result_json: result.pj,
      },
    ])
    return { error }
  })

  if (!quotaResult.ok) {
    const status = quotaResult.code === 'QUOTA_EXCEEDED' ? 403 : 400
    return NextResponse.json(
      { error: quotaResult.message, code: quotaResult.code },
      { status }
    )
  }

  revalidateTag(`simulations-${user.id}`)

  return NextResponse.json({
    ok: true,
    result: {
      clt: result.clt,
      pj: result.pj,
      deltaLiquido: result.deltaLiquido,
    },
    comparisons_remaining: quotaResult.quota.comparisonsRemaining,
    unlimited: quotaResult.quota.unlimited,
  })
}
