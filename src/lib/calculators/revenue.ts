/**
 * Agregação de faturamento mensal PJ/MEI (lançado manualmente ou importado
 * de extrato) — base compartilhada pelo alerta de MEI e pelo DAS real.
 * Funções puras: recebem as entradas já carregadas do banco, não fazem
 * I/O (isso fica nas server actions em src/app/app/revenue-actions.ts).
 */
import { calcularDASSimplesNacional, type SimplesNacionalAnexo } from './tax'
import { money } from './utils'

export type RevenueEntry = {
  /** Primeiro dia do mês de competência, formato YYYY-MM-DD. */
  competencia: string
  valor: number
  fonte: 'manual' | 'extrato'
}

function anoDe(competencia: string): number {
  return Number(competencia.slice(0, 4))
}

function mesDe(competencia: string): number {
  return Number(competencia.slice(5, 7))
}

export function sumRevenueForYear(entries: RevenueEntry[], ano: number): number {
  return money(
    entries.filter((e) => anoDe(e.competencia) === ano).reduce((sum, e) => sum + e.valor, 0)
  )
}

export function monthsWithEntryForYear(entries: RevenueEntry[], ano: number): number {
  return new Set(entries.filter((e) => anoDe(e.competencia) === ano).map((e) => mesDe(e.competencia))).size
}

/**
 * Soma o faturamento dos últimos 12 meses terminando em `competenciaFim`
 * (inclusive) — é o que o Simples Nacional considera pra definir a faixa
 * de alíquota do DAS (RBT12), não o faturamento anual civil.
 */
export function sumRevenueLast12Months(entries: RevenueEntry[], competenciaFim: string): number {
  const fim = new Date(`${competenciaFim}T00:00:00`)
  const inicio = new Date(fim)
  inicio.setMonth(inicio.getMonth() - 11)

  return money(
    entries
      .filter((e) => {
        const d = new Date(`${e.competencia}T00:00:00`)
        return d >= inicio && d <= fim
      })
      .reduce((sum, e) => sum + e.valor, 0)
  )
}

export type DasDoMesResult = {
  competencia: string
  faturamentoMensal: number
  faturamentoAcumulado12Meses: number
  anexo: SimplesNacionalAnexo
  valorDas: number
  vencimento: string // YYYY-MM-DD
  diasParaVencer: number | null
}

/**
 * Vencimento do DAS: dia 20 do mês seguinte à competência (regra padrão do
 * Simples Nacional — antecipa pro dia útil anterior quando cai em fim de
 * semana/feriado nacional, o que esta função não verifica; é aproximação,
 * mesma ressalva já usada pro Método de sessão de trabalho no vault).
 */
export function calcularVencimentoDAS(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number)
  const proximoMes = mes === 12 ? 1 : mes + 1
  const proximoAno = mes === 12 ? ano + 1 : ano
  return `${proximoAno}-${String(proximoMes).padStart(2, '0')}-20`
}

export function calcularDasDoMes(
  entries: RevenueEntry[],
  competencia: string,
  anexo: SimplesNacionalAnexo,
  hoje: Date = new Date()
): DasDoMesResult {
  const entradaDoMes = entries.find((e) => e.competencia === competencia)
  const faturamentoMensal = entradaDoMes?.valor ?? 0
  const faturamentoAcumulado12Meses = sumRevenueLast12Months(entries, competencia)

  const valorDas = calcularDASSimplesNacional(faturamentoMensal, anexo, faturamentoAcumulado12Meses)
  const vencimento = calcularVencimentoDAS(competencia)

  // Diferença em dias-calendário, sem depender de parsing implícito de Date
  // (string "YYYY-MM-DD" vira UTC, "YYYY-MM-DDTHH:mm:ss" sem "Z" vira
  // horário local — misturar os dois gera off-by-one perto da meia-noite
  // dependendo do fuso). Usa Date.UTC nos componentes de calendário dos
  // dois lados pra manter a mesma base de comparação sempre.
  const [vAno, vMes, vDia] = vencimento.split('-').map(Number)
  const vencimentoUTC = Date.UTC(vAno, vMes - 1, vDia)
  const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const diasParaVencer = Math.round((vencimentoUTC - hojeUTC) / (1000 * 60 * 60 * 24))

  return {
    competencia,
    faturamentoMensal,
    faturamentoAcumulado12Meses,
    anexo,
    valorDas,
    vencimento,
    diasParaVencer,
  }
}

export function competenciaAtual(hoje: Date = new Date()): string {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
}
