import { clampNumber, money } from '@/lib/calculators/utils'
import type { MonthlySimulationInput, MonthlySimulationResult } from '@/lib/calculators/types'

type ProgressiveSlice = { upTo: number; rate: number }
type IrBracket = { upTo: number; rate: number; deduction: number }

// Tabelas (Brasil) — manter aqui facilita atualização futura.
// Referência: faixas progressivas (INSS) e tabela mensal IRRF.
// Obs.: não consideramos dependentes, pensão, desconto simplificado etc.
const INSS_2024: { ceiling: number; slices: ProgressiveSlice[] } = {
  ceiling: 7786.02,
  slices: [
    { upTo: 1412.0, rate: 0.075 },
    { upTo: 2666.68, rate: 0.09 },
    { upTo: 4000.03, rate: 0.12 },
    { upTo: 7786.02, rate: 0.14 },
  ],
}

const IRRF_2023_2024: { brackets: IrBracket[] } = {
  brackets: [
    { upTo: 2112.0, rate: 0, deduction: 0 },
    { upTo: 2826.65, rate: 0.075, deduction: 158.4 },
    { upTo: 3751.05, rate: 0.15, deduction: 370.4 },
    { upTo: 4664.68, rate: 0.225, deduction: 651.73 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 884.96 },
  ],
}

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
  const base = Math.min(Math.max(0, bruto), INSS_2024.ceiling)
  return calcProgressive(base, INSS_2024.slices)
}

function calcIRRF_CLT(baseCalculo: number) {
  const base = Math.max(0, baseCalculo)
  const b = IRRF_2023_2024.brackets.find((x) => base <= x.upTo) ?? IRRF_2023_2024.brackets[IRRF_2023_2024.brackets.length - 1]
  const tax = base * b.rate - b.deduction
  return money(Math.max(0, tax))
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

  const adicionais = money((salarioBase * adicionaisPercentual) / 100)

  const atrasos = money(valorHora * atrasosHoras)

  const bruto = money(salarioBase + horasExtrasOuBonus + adicionais - atrasos)
  const inss = input.contractType === 'clt' ? calcINSS_CLT(bruto) : 0
  const baseIrrf = input.contractType === 'clt' ? money(bruto - inss) : 0
  const irrf = input.contractType === 'clt' ? calcIRRF_CLT(baseIrrf) : 0

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
    { key: 'add', label: 'Adicionais (%)', amount: adicionais, kind: 'earning' as const },
    { key: 'late', label: 'Atrasos/Faltas', amount: atrasos, kind: 'deduction' as const },
    ...(input.contractType === 'clt'
      ? ([
          { key: 'inss', label: 'INSS (progressivo)', amount: inss, kind: 'deduction' as const },
          { key: 'irrf', label: 'IRRF (progressivo) — base: bruto − INSS', amount: irrf, kind: 'deduction' as const },
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

