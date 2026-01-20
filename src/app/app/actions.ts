'use server'

import { revalidateTag } from 'next/cache'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { compareCltVsPj } from '@/lib/calculators/compare'
import { simulateTermination } from '@/lib/calculators/termination'
import { simulateThirteenth } from '@/lib/calculators/thirteenth'
import { simulateVacation } from '@/lib/calculators/vacation'
import type { MonthlySimulationInput, CompareInput, TerminationInput, ThirteenthInput, VacationInput } from '@/lib/calculators/types'
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

  // Para PJ: verifica se usa cálculo real ou percentual genérico
  const proLaboreStr = formData.get('proLabore')
  const anexoStr = formData.get('anexoSimplesNacional')
  const usaCalculoRealPJ = contractType === 'pj' && proLaboreStr && anexoStr

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
    // Para CLT ignoramos (INSS/IRRF são automáticos). Para PJ: sempre usar cálculo real quando disponível
    descontosPercentual: undefined, // Campo removido: sempre usar cálculo real
    proLabore: usaCalculoRealPJ ? num(proLaboreStr) : undefined,
    anexoSimplesNacional: usaCalculoRealPJ ? (anexoStr === 'V' ? 'V' : 'III') : undefined,
    dependentes: contractType === 'clt' ? num(formData.get('dependentes'), 0) : undefined,
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

  // Revalida cache do dashboard e histórico
  revalidateTag(`simulations-${user.id}`)

  return { ok: true, data: { input, result } }
}

export async function createCompare(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  // Para PJ: verifica se usa cálculo real ou percentual genérico
  const proLaboreStr = formData.get('proLabore')
  const anexoStr = formData.get('anexoSimplesNacional')
  const usaCalculoRealPJ = proLaboreStr && anexoStr

  const input: CompareInput = {
    salarioBase: num(formData.get('salarioBase')),
    jornadaMensalHoras: num(formData.get('jornadaMensalHoras'), 220),
    horas50: num(formData.get('horas50')),
    horas100: num(formData.get('horas100')),
    horas150: num(formData.get('horas150')),
    atrasosHoras: num(formData.get('atrasosHoras')),
    adicionaisPercentual: num(formData.get('adicionaisPercentual')),
    dependentes: num(formData.get('dependentes'), 0),
    proLabore: usaCalculoRealPJ ? num(proLaboreStr) : undefined,
    anexoSimplesNacional: usaCalculoRealPJ ? (anexoStr === 'V' ? 'V' : 'III') : undefined,
    faturamentoAnualAcumulado: usaCalculoRealPJ ? num(formData.get('faturamentoAnualAcumulado')) : undefined,
    descontosPjPercentual: !usaCalculoRealPJ ? num(formData.get('descontosPjPercentual'), 10) : undefined,
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

  // Revalida cache do dashboard e histórico
  const {
    data: { user: userCompare },
  } = await supabase.auth.getUser()
  if (userCompare) {
    revalidateTag(`simulations-${userCompare.id}`)
  }

  return { ok: true, data: { input, result } }
}

export async function createTermination(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  const tipoRescisaoStr = formData.get('tipoRescisao')
  const mesesPeriodoAquisitivoStr = formData.get('mesesPeriodoAquisitivo')
  const input: TerminationInput = {
    salarioBase: num(formData.get('salarioBase')),
    mesesTrabalhadosNoAno: num(formData.get('mesesTrabalhadosNoAno')),
    mesesPeriodoAquisitivo: mesesPeriodoAquisitivoStr && mesesPeriodoAquisitivoStr.toString().trim() !== '' 
      ? num(mesesPeriodoAquisitivoStr) 
      : undefined,
    avisoPrevioDias: num(formData.get('avisoPrevioDias'), 30),
    feriasVencidas: formData.get('feriasVencidas') === 'on',
    saldoFgtsMesesEstimado: num(formData.get('saldoFgtsMesesEstimado')),
    diasTrabalhadosNoMes: num(formData.get('diasTrabalhadosNoMes'), 15),
    tipoRescisao:
      tipoRescisaoStr === 'acordo'
        ? 'acordo'
        : tipoRescisaoStr === 'pedido_demissao'
          ? 'pedido_demissao'
          : tipoRescisaoStr === 'justa_causa'
            ? 'justa_causa'
            : 'sem_justa_causa',
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

  // Revalida cache do dashboard e histórico
  revalidateTag(`simulations-${user.id}`)

  return { ok: true, data: { input, result } }
}

export async function deleteSimulation(simulationId: string): Promise<ActionState<null>> {
  const supabase = createSupabaseActionClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  // Verifica se a simulação pertence ao usuário
  const { data: simulation, error: fetchError } = await supabase
    .from('simulations')
    .select('user_id')
    .eq('id', simulationId)
    .single()

  if (fetchError || !simulation) {
    return { ok: false, message: 'Simulação não encontrada.' }
  }

  if (simulation.user_id !== user.id) {
    return { ok: false, message: 'Você não tem permissão para excluir esta simulação.' }
  }

  // Deleta a simulação
  const { error } = await supabase
    .from('simulations')
    .delete()
    .eq('id', simulationId)
    .eq('user_id', user.id)

  if (error) return { ok: false, message: error.message }

  // Revalida cache do histórico e dashboard
  revalidateTag(`simulations-${user.id}`)

  return { ok: true, data: null }
}

export async function createThirteenthSimulation(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  const input: ThirteenthInput = {
    salarioBase: num(formData.get('salarioBase')),
    mesesTrabalhados: num(formData.get('mesesTrabalhados'), 12),
    dependentes: num(formData.get('dependentes'), 0),
    recebeuPrimeiraParcela: formData.get('recebeuPrimeiraParcela') === 'on',
  }

  const result = simulateThirteenth(input)

  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { error } = await supabase.from('simulations').insert({
    user_id: user.id,
    contract_type: 'clt',
    input_json: { kind: 'thirteenth', ...input },
    result_json: result,
  })

  if (error) return { ok: false, message: error.message }

  revalidateTag(`simulations-${user.id}`)

  return { ok: true, data: { input, result } }
}

export async function createVacationSimulation(
  _prev: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  const input: VacationInput = {
    salarioBase: num(formData.get('salarioBase')),
    mesesTrabalhados: num(formData.get('mesesTrabalhados'), 12),
    dependentes: num(formData.get('dependentes'), 0),
    temFeriasVencidas: formData.get('temFeriasVencidas') === 'on',
  }

  const result = simulateVacation(input)

  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { error } = await supabase.from('simulations').insert({
    user_id: user.id,
    contract_type: 'clt',
    input_json: { kind: 'vacation', ...input },
    result_json: result,
  })

  if (error) return { ok: false, message: error.message }

  revalidateTag(`simulations-${user.id}`)

  return { ok: true, data: { input, result } }
}
