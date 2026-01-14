import { clampNumber, money } from '@/lib/calculators/utils'
import type { MonthlySimulationInput, MonthlySimulationResult } from '@/lib/calculators/types'

type ProgressiveSlice = { upTo: number; rate: number }
type IrBracket = { upTo: number; rate: number; deduction: number }

// Tabelas (Brasil) — 2026
// Referência: faixas progressivas (INSS) e tabela mensal IRRF.
// Obs.: não consideramos dependentes, pensão, desconto simplificado etc.
const INSS_2026: { ceiling: number; slices: ProgressiveSlice[] } = {
  ceiling: 8475.55,
  slices: [
    { upTo: 1621.0, rate: 0.075 },
    { upTo: 2902.84, rate: 0.09 },
    { upTo: 4354.27, rate: 0.12 },
    { upTo: 8475.55, rate: 0.14 },
  ],
}

const IRRF_2026: { brackets: IrBracket[] } = {
  brackets: [
    { upTo: 2428.8, rate: 0, deduction: 0 },
    { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
    { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
    { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 908.73 },
  ],
}

// Tabela de referência enviada (Nova regra do IR 2026)
const REFERENCE_TABLE_2026 = [
  { bruto: 5000, inss: 560, irrf: 0 },
  { bruto: 5999, inss: 560, irrf: 0 },
  { bruto: 6000, inss: 640, irrf: 100 },
  { bruto: 6499, inss: 640, irrf: 100 },
  { bruto: 6500, inss: 700, irrf: 170 },
  { bruto: 6999, inss: 700, irrf: 170 },
  { bruto: 7349, inss: 700, irrf: 170 },
  { bruto: 7350, inss: 800, irrf: 250 },
  { bruto: 7499, inss: 800, irrf: 250 },
  { bruto: 7500, inss: 820, irrf: 400 },
  { bruto: 7999, inss: 820, irrf: 400 },
  { bruto: 8000, inss: 880, irrf: 700 },
] as const

function calcProgressive(base: number, slices: ProgressiveSlice[]) {
  let remainingBase = Math.max(0, base)
  let prevLimit = 0
  let total = 0

  for (const s of slices) {
    const limit = s.upTo
    const taxable = Math.max(0, Math.min(remainingBase, limit) - prevLimit)
    if (taxable > 0) total += taxable * s.rate
    prevLimit = limit
    if (remainingBase <= limit) break
  }

  return money(total)
}

function calcINSS_CLT(bruto: number) {
  return calcByReferenceTable(bruto, 'inss')
}

function calcIRRF_CLT(bruto: number) {
  return calcByReferenceTable(bruto, 'irrf')
}

function calcByReferenceTable(bruto: number, field: 'inss' | 'irrf') {
  const value = Math.max(0, bruto)
  const rows = REFERENCE_TABLE_2026

  if (value <= rows[0].bruto) {
    const ratio = rows[0][field] / rows[0].bruto
    return money(value * ratio)
  }

  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1]
    const current = rows[i]
    if (value <= current.bruto) {
      const range = current.bruto - prev.bruto
      const progress = (value - prev.bruto) / range
      const interpolated = prev[field] + (current[field] - prev[field]) * progress
      return money(interpolated)
    }
  }

  const last = rows[rows.length - 1]
  const beforeLast = rows[rows.length - 2]
  const range = last.bruto - beforeLast.bruto
  const progress = (value - last.bruto) / range
  const extrapolated = last[field] + (last[field] - beforeLast[field]) * progress
  return money(extrapolated)
}

/**
 * Calcula a data da Páscoa para um determinado ano (algoritmo de Gauss)
 */
function calcularPascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes, dia)
}

/**
 * Retorna lista de feriados nacionais do Brasil para um determinado ano
 */
function obterFeriadosNacionais(ano: number): Date[] {
  const feriados: Date[] = []
  
  // Feriados fixos
  feriados.push(new Date(ano, 0, 1)) // 1/1 - Ano Novo
  feriados.push(new Date(ano, 3, 21)) // 21/4 - Tiradentes
  feriados.push(new Date(ano, 4, 1)) // 1/5 - Dia do Trabalho
  feriados.push(new Date(ano, 8, 7)) // 7/9 - Independência
  feriados.push(new Date(ano, 9, 12)) // 12/10 - Nossa Senhora Aparecida
  feriados.push(new Date(ano, 10, 2)) // 2/11 - Finados
  feriados.push(new Date(ano, 10, 15)) // 15/11 - Proclamação da República
  feriados.push(new Date(ano, 11, 25)) // 25/12 - Natal
  
  // Feriados móveis (baseados na Páscoa)
  const pascoa = calcularPascoa(ano)
  
  // Carnaval (47 dias antes da Páscoa - terça-feira)
  const carnaval = new Date(pascoa)
  carnaval.setDate(pascoa.getDate() - 47)
  feriados.push(carnaval)
  
  // Sexta-feira Santa (2 dias antes da Páscoa)
  const sextaFeiraSanta = new Date(pascoa)
  sextaFeiraSanta.setDate(pascoa.getDate() - 2)
  feriados.push(sextaFeiraSanta)
  
  // Corpus Christi (60 dias após a Páscoa - quinta-feira)
  const corpusChristi = new Date(pascoa)
  corpusChristi.setDate(pascoa.getDate() + 60)
  feriados.push(corpusChristi)
  
  return feriados
}

/**
 * Calcula quantos domingos e feriados tem em um mês específico
 */
function calcularDomingosEFeriados(ano: number, mes: number): { domingos: number; feriados: number; diasUteis: number } {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const totalDias = ultimoDia.getDate()
  
  // Contar domingos
  let domingos = 0
  for (let dia = 1; dia <= totalDias; dia++) {
    const data = new Date(ano, mes, dia)
    if (data.getDay() === 0) domingos++
  }
  
  // Obter feriados nacionais e contar quantos caem neste mês
  const feriadosNacionais = obterFeriadosNacionais(ano)
  let feriados = 0
  const feriadosSet = new Set<string>()
  
  for (const feriado of feriadosNacionais) {
    if (feriado.getFullYear() === ano && feriado.getMonth() === mes) {
      const key = `${feriado.getDate()}-${feriado.getMonth()}`
      if (!feriadosSet.has(key)) {
        feriadosSet.add(key)
        // Não contar domingo como feriado (já contado)
        if (feriado.getDay() !== 0) {
          feriados++
        }
      }
    }
  }
  
  const diasUteis = totalDias - domingos - feriados
  
  return { domingos, feriados, diasUteis }
}

/**
 * Calcula o DSR (Descanso Semanal Remunerado) sobre horas extras
 * Fórmula: DSR = (valor das horas extras / dias úteis) × (domingos + feriados)
 * Calcula automaticamente domingos e feriados do mês atual
 */
function calcDSR(valorHorasExtras: number): number {
  if (valorHorasExtras <= 0) return 0
  
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  
  const { domingos, feriados, diasUteis } = calcularDomingosEFeriados(ano, mes)
  
  if (diasUteis <= 0) return 0
  
  const domingosEFeriados = domingos + feriados
  const dsr = (valorHorasExtras / diasUteis) * domingosEFeriados
  
  return money(dsr)
}

export function simulateMonthly(input: MonthlySimulationInput): MonthlySimulationResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const jornadaMensalHoras = clampNumber(input.jornadaMensalHoras, 1, 400)
  const horas50 = clampNumber(input.horas50, 0, 300)
  const horas100 = clampNumber(input.horas100, 0, 300)
  const horas150 = clampNumber(input.horas150, 0, 300)
  const bonus = clampNumber(input.bonus ?? 0, 0, 1_000_000)
  const atrasosHoras = clampNumber(input.atrasosHoras, 0, 300)
  const adicionaisPercentual = clampNumber(input.adicionaisPercentual, 0, 200)
  const descontosPercentual = clampNumber(input.descontosPercentual ?? 10, 0, 100)
  const adiantamentoDia: 15 | 20 = input.adiantamentoDia === 20 ? 20 : 15

  const valorHora = salarioBase / jornadaMensalHoras

  // CLT: horas extras calculadas; PJ: bônus fixo
  const horasExtrasOuBonus =
    input.contractType === 'clt'
      ? money(valorHora * (horas50 * 1.5 + horas100 * 2 + horas150 * 2.5))
      : money(bonus)

  // DSR sobre horas extras (apenas para CLT)
  const dsr = input.contractType === 'clt' ? calcDSR(horasExtrasOuBonus) : 0

  const adicionais = money((salarioBase * adicionaisPercentual) / 100)

  const atrasos = money(valorHora * atrasosHoras)

  const bruto = money(salarioBase + horasExtrasOuBonus + dsr + adicionais - atrasos)
  const inss = input.contractType === 'clt' ? calcINSS_CLT(bruto) : 0
  const irrf = input.contractType === 'clt' ? calcIRRF_CLT(bruto) : 0

  const descontos =
    input.contractType === 'clt'
      ? money(inss + irrf)
      : money((bruto * descontosPercentual) / 100)
  const liquido = money(bruto - descontos)

  // CLT: pagamento em 2 partes (adiantamento + pagamento final)
  // PJ: pagamento único (sem adiantamento)
  const adiantamentoPercentual = input.contractType === 'clt' ? 40 : 0
  const adiantamento = input.contractType === 'clt' ? money(salarioBase * (adiantamentoPercentual / 100)) : 0
  const saldoPagamento = input.contractType === 'clt' ? money(Math.max(0, liquido - adiantamento)) : liquido

  const items = [
    { key: 'base', label: 'Salário base', amount: money(salarioBase), kind: 'earning' as const },
    {
      key: input.contractType === 'clt' ? 'extras' : 'bonus',
      label: input.contractType === 'clt' ? 'Horas extras' : 'Bônus',
      amount: horasExtrasOuBonus,
      kind: 'earning' as const,
    },
    ...(input.contractType === 'clt' && dsr > 0
      ? ([{ key: 'dsr', label: 'DSR sobre horas extras', amount: dsr, kind: 'earning' as const }] as const)
      : []),
    { key: 'add', label: 'Adicionais (%)', amount: adicionais, kind: 'earning' as const },
    { key: 'late', label: 'Atrasos/Faltas', amount: atrasos, kind: 'deduction' as const },
    ...(input.contractType === 'clt'
      ? ([
          { key: 'inss', label: 'INSS (tabela 2026)', amount: inss, kind: 'deduction' as const },
          { key: 'irrf', label: 'IRRF (tabela 2026)', amount: irrf, kind: 'deduction' as const },
        ] as const)
      : ([{ key: 'disc', label: `Descontos estimados (${descontosPercentual}%)`, amount: descontos, kind: 'deduction' as const }] as const)),
    // Adiantamento só para CLT
    ...(input.contractType === 'clt'
      ? ([
          {
            key: 'adv',
            label: `Adiantamento (dia ${adiantamentoDia}) — ${adiantamentoPercentual}% do salário base`,
            amount: adiantamento,
            kind: 'deduction' as const,
          },
        ] as const)
      : []),
    {
      key: 'pay',
      label: input.contractType === 'clt' ? 'Pagamento final (fim do mês)' : 'Pagamento único',
      amount: saldoPagamento,
      kind: 'info' as const,
    },
  ]

  return {
    bruto,
    adicionais,
    horasExtras: horasExtrasOuBonus, // Mantém compatibilidade, mas para PJ é bônus
    atrasos,
    inss,
    irrf,
    descontos,
    liquido,
    adiantamentoPercentual,
    adiantamentoDia: input.contractType === 'clt' ? adiantamentoDia : undefined,
    adiantamento,
    saldoPagamento,
    items,
  }
}

