'use server'

import { revalidateTag } from 'next/cache'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { parseExtratoCSV, agruparReceitaPorMes } from '@/lib/calculators/extrato-import'
import { toNumberOr } from '@/lib/number'
import type { SimplesNacionalAnexo } from '@/lib/calculators/tax'

type ActionState<T> = { ok: true; data: T } | { ok: false; message: string; code?: string }

function parseCompetencia(mesStr: FormDataEntryValue | null, anoStr: FormDataEntryValue | null): string | null {
  const mes = toNumberOr(mesStr, 0)
  const ano = toNumberOr(anoStr, 0)
  if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) return null
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

/** Cria ou atualiza (upsert) o faturamento de uma competência — lançamento manual. */
export async function upsertRevenueEntry(
  _prev: ActionState<{ id: string; competencia: string; valor: number }> | null,
  formData: FormData
): Promise<ActionState<{ id: string; competencia: string; valor: number }>> {
  const competencia = parseCompetencia(formData.get('mes'), formData.get('ano'))
  if (!competencia) return { ok: false, message: 'Mês/ano inválido.' }

  const valor = toNumberOr(formData.get('valor'), -1)
  if (valor < 0) return { ok: false, message: 'Valor inválido.' }

  const observacao = formData.get('observacao')

  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { data, error } = await supabase
    .from('pj_revenue_entries')
    .upsert(
      {
        user_id: user.id,
        competencia,
        valor,
        fonte: 'manual',
        observacao: observacao ? String(observacao) : null,
      },
      { onConflict: 'user_id,competencia' }
    )
    .select('id')
    .single()

  if (error) return { ok: false, message: error.message }

  revalidateTag(`pj-revenue-${user.id}`)

  return { ok: true, data: { id: data.id as string, competencia, valor } }
}

export async function deleteRevenueEntry(id: string): Promise<ActionState<null>> {
  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { error } = await supabase.from('pj_revenue_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }

  revalidateTag(`pj-revenue-${user.id}`)
  return { ok: true, data: null }
}

/** Salva a preferência de anexo do Simples Nacional (III ou V) do usuário. */
export async function updateAnexoSimples(
  _prev: ActionState<{ anexo: SimplesNacionalAnexo }> | null,
  formData: FormData
): Promise<ActionState<{ anexo: SimplesNacionalAnexo }>> {
  const anexoRaw = String(formData.get('anexo') ?? '')
  if (anexoRaw !== 'III' && anexoRaw !== 'V') return { ok: false, message: 'Anexo inválido.' }

  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const { error } = await supabase
    .from('profiles')
    .update({ anexo_simples_nacional: anexoRaw })
    .eq('id', user.id)

  if (error) return { ok: false, message: error.message }

  revalidateTag(`pj-revenue-${user.id}`)
  return { ok: true, data: { anexo: anexoRaw } }
}

export type ImportExtratoPreview = {
  entradas: Array<{ competencia: string; valor: number }>
  totalTransacoes: number
  transacoesPositivas: number
  erros: Array<{ linha: number; motivo: string }>
}

/**
 * Fase 1 da importação: só faz o parse e devolve uma prévia — não grava
 * nada ainda. O usuário confirma na tela antes de persistir (ver
 * confirmarImportacaoExtrato). Evita sobrescrever lançamento manual por
 * engano com um CSV do formato errado.
 */
export async function previewImportacaoExtrato(
  _prev: ActionState<ImportExtratoPreview> | null,
  formData: FormData
): Promise<ActionState<ImportExtratoPreview>> {
  const arquivo = formData.get('arquivo')
  if (!(arquivo instanceof File)) return { ok: false, message: 'Selecione um arquivo CSV.' }
  if (arquivo.size === 0) return { ok: false, message: 'Arquivo vazio.' }
  if (arquivo.size > 5 * 1024 * 1024) return { ok: false, message: 'Arquivo maior que 5 MB — provavelmente não é um extrato CSV.' }

  const conteudo = await arquivo.text()
  const resultado = parseExtratoCSV(conteudo)

  if (resultado.colunas === null) {
    return { ok: false, message: resultado.erros[0]?.motivo ?? 'Não consegui ler esse CSV.' }
  }

  const entradas = agruparReceitaPorMes(resultado.transacoes)
  const transacoesPositivas = resultado.transacoes.filter((t) => t.valor > 0).length

  return {
    ok: true,
    data: {
      entradas: entradas.map((e) => ({ competencia: e.competencia, valor: e.valor })),
      totalTransacoes: resultado.transacoes.length,
      transacoesPositivas,
      erros: resultado.erros,
    },
  }
}

/** Fase 2: grava as entradas já confirmadas pelo usuário (fonte = extrato, sobrescreve manual da mesma competência). */
export async function confirmarImportacaoExtrato(
  entradas: Array<{ competencia: string; valor: number }>
): Promise<ActionState<{ gravados: Array<{ id: string; competencia: string; valor: number }> }>> {
  if (entradas.length === 0) return { ok: false, message: 'Nada para importar.' }

  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Você precisa estar logado.' }

  const rows = entradas.map((e) => ({
    user_id: user.id,
    competencia: e.competencia,
    valor: e.valor,
    fonte: 'extrato' as const,
  }))

  const { data, error } = await supabase
    .from('pj_revenue_entries')
    .upsert(rows, { onConflict: 'user_id,competencia' })
    .select('id, competencia, valor')

  if (error) return { ok: false, message: error.message }

  revalidateTag(`pj-revenue-${user.id}`)
  return {
    ok: true,
    data: { gravados: (data ?? []) as Array<{ id: string; competencia: string; valor: number }> },
  }
}
