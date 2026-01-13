import { clampNumber, money } from '@/lib/calculators/utils'
import type { MonthlySimulationInput, MonthlySimulationResult } from '@/lib/calculators/types'

export function simulateMonthly(input: MonthlySimulationInput): MonthlySimulationResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const jornadaMensalHoras = clampNumber(input.jornadaMensalHoras, 1, 400)
  const horas50 = clampNumber(input.horas50, 0, 300)
  const horas100 = clampNumber(input.horas100, 0, 300)
  const horas150 = clampNumber(input.horas150, 0, 300)
  const atrasosHoras = clampNumber(input.atrasosHoras, 0, 300)
  const adicionaisPercentual = clampNumber(input.adicionaisPercentual, 0, 200)
  const descontosPercentual = clampNumber(input.descontosPercentual, 0, 100)
  const adiantamentoDia: 15 | 20 = input.adiantamentoDia === 20 ? 20 : 15

  const valorHora = salarioBase / jornadaMensalHoras

  const horasExtras = money(
    valorHora * (horas50 * 1.5 + horas100 * 2 + horas150 * 2.5)
  )

  const adicionais = money((salarioBase * adicionaisPercentual) / 100)

  const atrasos = money(valorHora * atrasosHoras)

  const bruto = money(salarioBase + horasExtras + adicionais - atrasos)
  const descontos = money((bruto * descontosPercentual) / 100)
  const liquido = money(bruto - descontos)

  // Pagamento em 2 partes (adiantamento + pagamento final)
  // Regra pedida: adiantamento = 40% do salário (salário base).
  const adiantamentoPercentual = 40
  const adiantamento = money(salarioBase * (adiantamentoPercentual / 100))
  const saldoPagamento = money(Math.max(0, liquido - adiantamento))

  const items = [
    { key: 'base', label: 'Salário base', amount: money(salarioBase), kind: 'earning' as const },
    { key: 'extras', label: 'Horas extras', amount: horasExtras, kind: 'earning' as const },
    { key: 'add', label: 'Adicionais (%)', amount: adicionais, kind: 'earning' as const },
    { key: 'late', label: 'Atrasos/Faltas', amount: atrasos, kind: 'deduction' as const },
    { key: 'disc', label: 'Descontos estimados', amount: descontos, kind: 'deduction' as const },
    // Adiantamento é pago antes (dia 15/20), então entra como "desconto" do pagamento final
    { key: 'adv', label: `Adiantamento (dia ${adiantamentoDia}) — ${adiantamentoPercentual}% do salário base`, amount: adiantamento, kind: 'deduction' as const },
    { key: 'pay', label: 'Pagamento final (fim do mês)', amount: saldoPagamento, kind: 'info' as const },
  ]

  return {
    bruto,
    adicionais,
    horasExtras,
    atrasos,
    descontos,
    liquido,
    adiantamentoPercentual,
    adiantamentoDia,
    adiantamento,
    saldoPagamento,
    items,
  }
}

