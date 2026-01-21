'use server'

import { createSupabaseActionClient } from '@/lib/supabase/server'

/**
 * Busca o último salário base salvo no histórico do usuário
 * Retorna null se não houver histórico ou se o usuário não estiver logado
 */
export async function getLastSalaryBase(): Promise<number | null> {
  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  try {
    // Busca a última simulação salva (qualquer tipo)
    const { data, error } = await supabase
      .from('simulations')
      .select('input_json')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data?.input_json) return null

    // Extrai o salário base do input_json
    const input = data.input_json
    const salarioBase = input.salarioBase

    if (typeof salarioBase === 'number' && salarioBase > 0) {
      return salarioBase
    }

    return null
  } catch (error) {
    console.error('Error getting last salary base:', error)
    return null
  }
}
