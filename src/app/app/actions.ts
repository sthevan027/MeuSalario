'use server'

import { createSupabaseActionClient } from '@/lib/supabase/server'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { compareCltVsPj } from '@/lib/calculators/compare'
import { simulateTermination } from '@/lib/calculators/termination'
import type { MonthlySimulationInput, CompareInput, TerminationInput } from '@/lib/calculators/types'
import { toNumberOr } from '@/lib/number'

type ActionState<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

function num(v: FormDataEntryValue | null, fallback = 0) {
  return toNumberOr(v, fallback)
}

export async function createMonthlySimulation(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  const contractType = String(formData.get('contractType') ?? 'clt') as MonthlySimulationInput['contractType']
  const adiantamentoDia = contractType === 'clt' ? (num(formData.get('adiantamentoDia'), 15) === 20 ? 20 : 15) : undefined

  // Lê mês e ano do formulário (opcionais, padrão: mês atual)
  const monthStr = formData.get('month')
  const yearStr = formData.get('year')
  const month = monthStr ? num(monthStr) : undefined
  const year = yearStr ? num(yearStr) : undefined

  const input: MonthlySimulationInput = {
    contractType,
    salarioBase: num(formData.get('salarioBase')),
    jornadaMensalHoras: num(formData.get('jornadaMensalHoras'), 220),
    horas50: contractType === 'clt' ? num(formData.get('horas50')) : 0,
    horas100: contractType === 'clt' ? num(formData.get('horas100')) : 0,
    horas150: contractType === 'clt' ? num(formData.get('horas150')) : 0,
    bonus: contractType === 'pj' ? num(formData.get('bonus')) : undefined,
    atrasosHoras: num(formData.get('atrasosHoras')),
    adicionaisPercentual: num(formData.get('adicionaisPercentual')),
    // Para CLT ignoramos (INSS/IRRF são automáticos). Para PJ serve como estimativa.
    descontosPercentual: contractType === 'pj' ? num(formData.get('descontosPercentual'), 10) : undefined,
    adiantamentoDia,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    year: year && year >= 2020 && year <= 2100 ? year : undefined,
  }

  const result = simulateMonthly(input)

  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { error } = await supabase.from('simulations').insert({
    user_id: user.id,
    contract_type: input.contractType,
    input_json: { kind: 'monthly', ...input },
    result_json: result,
  })

  if (error) return { ok: false, message: error.message }

  return { ok: true, data: { input, result } }
}

export async function createCompare(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  const input: CompareInput = {
    salarioBase: num(formData.get('salarioBase')),
    jornadaMensalHoras: num(formData.get('jornadaMensalHoras'), 220),
    horas50: num(formData.get('horas50')),
    horas100: num(formData.get('horas100')),
    horas150: num(formData.get('horas150')),
    atrasosHoras: num(formData.get('atrasosHoras')),
    adicionaisPercentual: num(formData.get('adicionaisPercentual')),
    descontosCltPercentual: num(formData.get('descontosCltPercentual')),
    descontosPjPercentual: num(formData.get('descontosPjPercentual')),
  }

  const result = compareCltVsPj(input)

  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

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

  if (error) return { ok: false, message: error.message }

  return { ok: true, data: { input, result } }
}

export async function createTermination(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  const input: TerminationInput = {
    salarioBase: num(formData.get('salarioBase')),
    mesesTrabalhadosNoAno: num(formData.get('mesesTrabalhadosNoAno')),
    avisoPrevioDias: num(formData.get('avisoPrevioDias'), 30),
    feriasVencidas: formData.get('feriasVencidas') === 'on',
    saldoFgtsMesesEstimado: num(formData.get('saldoFgtsMesesEstimado')),
  }

  const result = simulateTermination(input)

  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { error } = await supabase.from('simulations').insert({
    user_id: user.id,
    contract_type: 'clt',
    input_json: { kind: 'termination', ...input },
    result_json: result,
  })

  if (error) return { ok: false, message: error.message }

  return { ok: true, data: { input, result } }
}

