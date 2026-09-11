'use client'

import { useMemo, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MeiAlertCard } from './MeiAlertCard'
import { DasCard } from './DasCard'
import {
  upsertRevenueEntry,
  deleteRevenueEntry,
  updateAnexoSimples,
  previewImportacaoExtrato,
  confirmarImportacaoExtrato,
} from '@/app/app/revenue-actions'
import {
  sumRevenueForYear,
  monthsWithEntryForYear,
  calcularDasDoMes,
  competenciaAtual,
} from '@/lib/calculators/revenue'
import { calcularAlertaMei } from '@/lib/calculators/mei'
import type { SimplesNacionalAnexo } from '@/lib/calculators/tax'
import type { RevenueEntryRow } from '@/lib/pj-revenue-data'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-')
  return `${MESES[Number(mes) - 1]}/${ano}`
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function FaturamentoDashboard({
  initialEntries,
  anexoInicial,
  meiLimiteAnual,
}: {
  initialEntries: RevenueEntryRow[]
  anexoInicial: SimplesNacionalAnexo | null
  meiLimiteAnual: number
}) {
  const [entries, setEntries] = useState<RevenueEntryRow[]>(initialEntries)
  const [anexo, setAnexo] = useState<SimplesNacionalAnexo>(anexoInicial ?? 'III')
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [previewEntradas, setPreviewEntradas] = useState<Array<{ competencia: string; valor: number }> | null>(null)
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const hoje = useMemo(() => new Date(), [])
  const anoAtual = hoje.getFullYear()
  const competenciaHoje = competenciaAtual(hoje)

  const [entryState, entryAction] = useFormState(upsertRevenueEntry, null)
  const [anexoState, anexoAction] = useFormState(updateAnexoSimples, null)
  const [previewState, previewAction] = useFormState(previewImportacaoExtrato, null)

  // Sincroniza a lista local quando o lançamento manual dá certo (evita
  // esperar um refresh de página pra ver a entrada nova).
  const lastSavedRef = useRef('')
  if (entryState?.ok && entryState.data) {
    const marker = `${entryState.data.id}:${entryState.data.valor}`
    if (lastSavedRef.current !== marker) {
      lastSavedRef.current = marker
      const { id, competencia, valor } = entryState.data
      setEntries((prev) => [...prev.filter((e) => e.competencia !== competencia), { id, competencia, valor, fonte: 'manual' }])
    }
  }

  const lastPreviewRef = useRef(false)
  if (previewState?.ok && previewState.data && !lastPreviewRef.current) {
    lastPreviewRef.current = true
    setPreviewEntradas(previewState.data.entradas)
  }

  const faturamentoAno = useMemo(() => sumRevenueForYear(entries, anoAtual), [entries, anoAtual])
  const mesesComLancamento = useMemo(() => monthsWithEntryForYear(entries, anoAtual), [entries, anoAtual])

  const meiResult = useMemo(
    () =>
      calcularAlertaMei({
        faturamentoAcumuladoAno: faturamentoAno,
        mesesComLancamento,
        limiteAnual: meiLimiteAnual,
        mesAtual: hoje.getMonth() + 1,
      }),
    [faturamentoAno, mesesComLancamento, meiLimiteAnual, hoje]
  )

  const dasResult = useMemo(
    () => calcularDasDoMes(entries, competenciaHoje, anexo, hoje),
    [entries, competenciaHoje, anexo, hoje]
  )

  const entriesDoAno = useMemo(
    () =>
      entries
        .filter((e) => e.competencia.startsWith(String(anoAtual)))
        .sort((a, b) => b.competencia.localeCompare(a.competencia)),
    [entries, anoAtual]
  )

  async function handleDelete(entry: RevenueEntryRow) {
    setDeletandoId(entry.id)
    const result = await deleteRevenueEntry(entry.id)
    setDeletandoId(null)
    if (result.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    }
  }

  async function handleConfirmarImportacao() {
    if (!previewEntradas || previewEntradas.length === 0) return
    setImportando(true)
    const result = await confirmarImportacaoExtrato(previewEntradas)
    setImportando(false)
    if (result.ok) {
      setImportMsg(`${result.data.gravados.length} mês(es) importado(s) com sucesso.`)
      setEntries((prev) => {
        const competenciasNovas = new Set(result.data.gravados.map((g) => g.competencia))
        const semEssas = prev.filter((e) => !competenciasNovas.has(e.competencia))
        return [...semEssas, ...result.data.gravados.map((g) => ({ ...g, fonte: 'extrato' as const }))]
      })
      setPreviewEntradas(null)
      lastPreviewRef.current = false
    } else {
      setImportMsg(result.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Anexo do Simples Nacional */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <form action={anexoAction} className="flex flex-wrap items-end gap-3">
          <Field label="Anexo do Simples Nacional" hint="Usado para calcular o DAS a partir do faturamento lançado">
            <select
              name="anexo"
              value={anexo}
              onChange={(e) => setAnexo(e.target.value as SimplesNacionalAnexo)}
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="III">Anexo III (serviços em geral)</option>
              <option value="V">Anexo V (serviços profissionais)</option>
            </select>
          </Field>
          <SubmitButton label="Salvar anexo" pendingLabel="Salvando..." />
          {anexoState && !anexoState.ok && <p className="text-xs text-rose-400">{anexoState.message}</p>}
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MeiAlertCard result={meiResult} />
        <DasCard das={dasResult} />
      </div>

      {/* Lançamento manual */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Lançar faturamento do mês</h2>
        <form action={entryAction} className="mt-3 grid gap-3 sm:grid-cols-4">
          <Field label="Mês">
            <select
              name="mes"
              defaultValue={String(hoje.getMonth() + 1)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ano">
            <Input name="ano" type="number" defaultValue={anoAtual} min="2020" max="2100" />
          </Field>
          <Field label="Valor faturado">
            <Input name="valor" type="text" inputMode="decimal" placeholder="Ex.: 4.500,00" required />
          </Field>
          <div className="flex items-end">
            <SubmitButton label="Lançar" pendingLabel="Salvando..." />
          </div>
        </form>
        {entryState && !entryState.ok && <p className="mt-2 text-xs text-rose-400">{entryState.message}</p>}
      </div>

      {/* Importação de extrato */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Importar extrato (CSV)</h2>
        <p className="mt-1 text-xs text-slate-400">
          Aceita CSV com colunas de data e valor (ou débito/crédito separados). Só entradas positivas viram
          faturamento — despesas são ignoradas por enquanto.
        </p>

        {previewEntradas === null ? (
          <form action={previewAction} className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Arquivo CSV">
              <input
                type="file"
                name="arquivo"
                accept=".csv,text/csv"
                required
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-slate-700"
              />
            </Field>
            <SubmitButton label="Analisar arquivo" pendingLabel="Lendo..." />
          </form>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-300">
              {previewEntradas.length} mês(es) identificado(s) como faturamento:
            </p>
            <ul className="space-y-1 text-sm text-slate-200">
              {previewEntradas.map((e) => (
                <li key={e.competencia} className="flex justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <span>{formatCompetencia(e.competencia)}</span>
                  <span className="font-semibold">{brl(e.valor)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirmarImportacao} disabled={importando}>
                {importando ? 'Importando...' : 'Confirmar importação'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPreviewEntradas(null)
                  lastPreviewRef.current = false
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {previewState && !previewState.ok && <p className="mt-2 text-xs text-rose-400">{previewState.message}</p>}
        {importMsg && <p className="mt-2 text-xs text-emerald-300">{importMsg}</p>}
      </div>

      {/* Histórico do ano */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Faturamento de {anoAtual}</h2>
        {entriesDoAno.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum lançamento ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {entriesDoAno.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="text-slate-200">{formatCompetencia(e.competencia)}</span>
                  <span className="ml-2 text-xs text-slate-500">{e.fonte === 'extrato' ? '(extrato)' : '(manual)'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">{brl(e.valor)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(e)}
                    disabled={deletandoId !== null}
                    className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-50"
                  >
                    {deletandoId === e.id ? 'Removendo...' : 'Remover'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
