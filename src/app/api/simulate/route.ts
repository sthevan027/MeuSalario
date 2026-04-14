import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { persistWithSimulationQuota } from '@/lib/simulation-quota'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { parseMonthlySimulationBody } from '@/lib/simulations/monthly-api-body'
import type { MonthlySimulationInput } from '@/lib/calculators/types'

/**
 * POST /api/simulate — mesma regra da server action de simulação mensal (com quota FREE).
 * Corpo JSON: campos alinhados ao formulário (ex.: salarioBase, contractType, ...).
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let input: MonthlySimulationInput
  try {
    const body = await request.json()
    input = parseMonthlySimulationBody(body)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: e.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const result = simulateMonthly(input)

  const quotaResult = await persistWithSimulationQuota(supabase, user.id, async () => {
    const { error } = await supabase.from('simulations').insert({
      user_id: user.id,
      contract_type: input.contractType,
      input_json: { kind: 'monthly', ...input },
      result_json: result,
    })
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
    result,
    simulations_remaining: quotaResult.quota.simulationsRemaining,
    unlimited: quotaResult.quota.unlimited,
  })
}
