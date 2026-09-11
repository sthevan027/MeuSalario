/**
 * Importação de extrato bancário (CSV) — MVP da feature "de simulador pra
 * copiloto fiscal". Formatos de CSV de banco variam MUITO entre
 * instituições (delimitador, nomes de coluna, formato de data/valor,
 * débito/crédito em colunas separadas ou não). Este parser tenta detectar
 * o formato pelos cabeçalhos mais comuns em extratos brasileiros
 * (Nubank, Inter, Itaú, C6, PJ genérico) em vez de assumir um layout fixo.
 *
 * Escopo do MVP: só CSV (OFX fica pra depois — formato mais complexo,
 * variação maior entre bancos, risco de meia-implementação errada é pior
 * que não ter). Ver relatório da sessão de 2026-09-11 pra contexto.
 *
 * Função pura — não faz I/O. Quem chama (server action / componente) lê o
 * arquivo e passa o texto aqui.
 */
import { money } from './utils'
import type { RevenueEntry } from './revenue'

export type ExtratoTransacao = {
  data: string // YYYY-MM-DD
  descricao: string
  valor: number // positivo = entrada, negativo = saída
  linhaOriginal: number
}

export type ExtratoErro = {
  linha: number
  motivo: string
}

export type ParseExtratoResult = {
  transacoes: ExtratoTransacao[]
  erros: ExtratoErro[]
  totalLinhas: number
  delimitador: ',' | ';'
  colunas: {
    data: number
    valor: number | null
    descricao: number | null
    debito: number | null
    credito: number | null
  } | null
}

function normalizarCabecalho(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

function detectarDelimitador(primeiraLinha: string): ',' | ';' {
  const virgulas = (primeiraLinha.match(/,/g) ?? []).length
  const pontoVirgulas = (primeiraLinha.match(/;/g) ?? []).length
  return pontoVirgulas > virgulas ? ';' : ','
}

/** Split simples respeitando campos entre aspas — CSVs de banco raramente
 * têm aspas aninhadas, então não precisa de um parser RFC4180 completo. */
function splitLinhaCSV(linha: string, delimitador: string): string[] {
  const campos: string[] = []
  let atual = ''
  let dentroAspas = false

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      dentroAspas = !dentroAspas
      continue
    }
    if (c === delimitador && !dentroAspas) {
      campos.push(atual.trim())
      atual = ''
      continue
    }
    atual += c
  }
  campos.push(atual.trim())
  return campos
}

const CANDIDATOS_DATA = ['data', 'date', 'dt', 'data lancamento', 'data da transacao', 'data movimento']
const CANDIDATOS_VALOR = ['valor', 'amount', 'value', 'montante']
const CANDIDATOS_DEBITO = ['debito', 'saida', 'valor debito', 'débito']
const CANDIDATOS_CREDITO = ['credito', 'entrada', 'valor credito', 'crédito']
const CANDIDATOS_DESCRICAO = ['descricao', 'descrição', 'historico', 'histórico', 'memo', 'detalhes', 'title', 'lançamento', 'lancamento']

function acharColuna(cabecalhos: string[], candidatos: string[]): number | null {
  for (const candidato of candidatos) {
    const idx = cabecalhos.findIndex((h) => h === candidato)
    if (idx !== -1) return idx
  }
  // fallback: contains (ex.: "valor (R$)")
  for (const candidato of candidatos) {
    const idx = cabecalhos.findIndex((h) => h.includes(candidato))
    if (idx !== -1) return idx
  }
  return null
}

/** Aceita "1.234,56" (padrão BR) e "1234.56" (padrão US/ISO). */
export function parseValorMonetario(bruto: string): number | null {
  let s = bruto.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '')
  if (s === '') return null

  const negativo = /^-|\(.*\)$/.test(s) || s.startsWith('-')
  s = s.replace(/[()]/g, '').replace(/^-/, '')

  const temVirgula = s.includes(',')
  const temPonto = s.includes('.')

  if (temVirgula && temPonto) {
    // "1.234,56" -> ponto é milhar, vírgula é decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (temVirgula) {
    // "1234,56" -> vírgula é decimal
    s = s.replace(',', '.')
  }
  // só ponto: assume decimal já no formato certo ("1234.56")

  const n = Number(s)
  if (Number.isNaN(n)) return null
  return negativo ? -n : n
}

/** Aceita DD/MM/YYYY, DD-MM-YYYY e YYYY-MM-DD. */
export function parseDataExtrato(bruto: string): string | null {
  const s = bruto.trim()

  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, ano, mes, dia] = isoMatch
    return `${ano}-${mes}-${dia}`
  }

  const brMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (brMatch) {
    const [, diaStr, mesStr, anoStr] = brMatch
    const dia = diaStr.padStart(2, '0')
    const mes = mesStr.padStart(2, '0')
    const ano = anoStr.length === 2 ? `20${anoStr}` : anoStr
    if (Number(mes) < 1 || Number(mes) > 12 || Number(dia) < 1 || Number(dia) > 31) return null
    return `${ano}-${mes}-${dia}`
  }

  return null
}

export function parseExtratoCSV(conteudo: string): ParseExtratoResult {
  const linhas = conteudo.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '')
  if (linhas.length === 0) {
    return { transacoes: [], erros: [{ linha: 0, motivo: 'Arquivo vazio.' }], totalLinhas: 0, delimitador: ',', colunas: null }
  }

  const delimitador = detectarDelimitador(linhas[0])
  const cabecalhosBrutos = splitLinhaCSV(linhas[0], delimitador)
  const cabecalhos = cabecalhosBrutos.map(normalizarCabecalho)

  const idxData = acharColuna(cabecalhos, CANDIDATOS_DATA)
  const idxValor = acharColuna(cabecalhos, CANDIDATOS_VALOR)
  const idxDebito = acharColuna(cabecalhos, CANDIDATOS_DEBITO)
  const idxCredito = acharColuna(cabecalhos, CANDIDATOS_CREDITO)
  const idxDescricao = acharColuna(cabecalhos, CANDIDATOS_DESCRICAO)

  if (idxData === null || (idxValor === null && idxCredito === null && idxDebito === null)) {
    return {
      transacoes: [],
      erros: [{
        linha: 1,
        motivo: `Não consegui identificar as colunas de data/valor no cabeçalho ("${cabecalhosBrutos.join(delimitador)}"). Formatos aceitos: coluna "Data" + ("Valor" ou "Débito"/"Crédito").`,
      }],
      totalLinhas: linhas.length - 1,
      delimitador,
      colunas: null,
    }
  }

  const transacoes: ExtratoTransacao[] = []
  const erros: ExtratoErro[] = []

  for (let i = 1; i < linhas.length; i++) {
    const numeroLinha = i + 1
    const campos = splitLinhaCSV(linhas[i], delimitador)

    const dataStr = campos[idxData]
    const data = dataStr ? parseDataExtrato(dataStr) : null
    if (!data) {
      erros.push({ linha: numeroLinha, motivo: `Data inválida: "${dataStr ?? ''}".` })
      continue
    }

    let valor: number | null = null
    if (idxValor !== null) {
      valor = parseValorMonetario(campos[idxValor] ?? '')
    } else {
      const credito = idxCredito !== null ? parseValorMonetario(campos[idxCredito] ?? '') : null
      const debito = idxDebito !== null ? parseValorMonetario(campos[idxDebito] ?? '') : null
      if (credito !== null && credito !== 0) valor = Math.abs(credito)
      else if (debito !== null && debito !== 0) valor = -Math.abs(debito)
      else valor = 0
    }

    if (valor === null) {
      erros.push({ linha: numeroLinha, motivo: `Valor inválido na linha ${numeroLinha}.` })
      continue
    }

    transacoes.push({
      data,
      descricao: idxDescricao !== null ? (campos[idxDescricao] ?? '') : '',
      valor: money(valor),
      linhaOriginal: numeroLinha,
    })
  }

  return {
    transacoes,
    erros,
    totalLinhas: linhas.length - 1,
    delimitador,
    colunas: { data: idxData, valor: idxValor, descricao: idxDescricao, debito: idxDebito, credito: idxCredito },
  }
}

/**
 * Agrupa as transações positivas (entradas) por mês — é o que vira
 * faturamento pra fins de DAS/MEI. Transações negativas (despesas) são
 * ignoradas no MVP (o produto ainda não modela despesas dedutíveis).
 */
export function agruparReceitaPorMes(transacoes: ExtratoTransacao[]): RevenueEntry[] {
  const porMes = new Map<string, number>()

  for (const t of transacoes) {
    if (t.valor <= 0) continue
    const competencia = `${t.data.slice(0, 7)}-01`
    porMes.set(competencia, money((porMes.get(competencia) ?? 0) + t.valor))
  }

  return Array.from(porMes.entries())
    .map(([competencia, valor]) => ({ competencia, valor, fonte: 'extrato' as const }))
    .sort((a, b) => a.competencia.localeCompare(b.competencia))
}
