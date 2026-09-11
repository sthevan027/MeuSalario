import type { SupabaseClient } from '@supabase/supabase-js'
import type { RevenueEntry } from './calculators/revenue'

/** Entrada de faturamento já persistida (carrega o id, pra permitir excluir). */
export type RevenueEntryRow = RevenueEntry & { id: string }

/**
 * Busca as entradas de faturamento dos últimos `meses` meses (padrão 24,
 * cobre com folga tanto a visão anual quanto o cálculo de DAS por RBT12
 * que olha 12 meses pra trás da competência atual).
 */
export async function getRecentRevenueEntries(
  supabase: SupabaseClient,
  userId: string,
  meses = 24
): Promise<RevenueEntryRow[]> {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1)
  const inicioStr = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('pj_revenue_entries')
    .select('id, competencia, valor, fonte')
    .eq('user_id', userId)
    .gte('competencia', inicioStr)
    .order('competencia', { ascending: true })

  if (error) {
    console.error('[pj-revenue-data] getRecentRevenueEntries:', error.message)
    return []
  }

  return (data ?? []) as RevenueEntryRow[]
}
