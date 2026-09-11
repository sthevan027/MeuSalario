import { describe, it, expect } from 'vitest'
import {
  sumRevenueForYear,
  monthsWithEntryForYear,
  sumRevenueLast12Months,
  calcularVencimentoDAS,
  calcularDasDoMes,
  competenciaAtual,
  type RevenueEntry,
} from '../revenue'

const entries: RevenueEntry[] = [
  { competencia: '2025-10-01', valor: 5000, fonte: 'manual' },
  { competencia: '2025-11-01', valor: 6000, fonte: 'manual' },
  { competencia: '2025-12-01', valor: 7000, fonte: 'extrato' },
  { competencia: '2026-01-01', valor: 4000, fonte: 'manual' },
  { competencia: '2026-02-01', valor: 4500, fonte: 'manual' },
  { competencia: '2026-06-01', valor: 8000, fonte: 'extrato' },
]

describe('sumRevenueForYear', () => {
  it('soma só as entradas do ano pedido', () => {
    expect(sumRevenueForYear(entries, 2026)).toBe(4000 + 4500 + 8000)
    expect(sumRevenueForYear(entries, 2025)).toBe(5000 + 6000 + 7000)
  })

  it('devolve 0 pra ano sem entradas', () => {
    expect(sumRevenueForYear(entries, 2020)).toBe(0)
  })
})

describe('monthsWithEntryForYear', () => {
  it('conta quantos meses distintos têm lançamento no ano', () => {
    expect(monthsWithEntryForYear(entries, 2026)).toBe(3)
    expect(monthsWithEntryForYear(entries, 2025)).toBe(3)
  })
})

describe('sumRevenueLast12Months', () => {
  it('soma os últimos 12 meses terminando na competência dada (RBT12)', () => {
    // até 2026-02 (inclusive), olhando 12 meses pra trás: 2025-03 até 2026-02
    // das entradas disponíveis, entram: out/25, nov/25, dez/25, jan/26, fev/26
    const total = sumRevenueLast12Months(entries, '2026-02-01')
    expect(total).toBe(5000 + 6000 + 7000 + 4000 + 4500)
  })

  it('não inclui meses fora da janela de 12 meses', () => {
    // até 2026-06: janela vai de 2025-07 até 2026-06 — todas as entradas entram
    const total = sumRevenueLast12Months(entries, '2026-06-01')
    expect(total).toBe(5000 + 6000 + 7000 + 4000 + 4500 + 8000)
  })
})

describe('calcularVencimentoDAS', () => {
  it('vence dia 20 do mês seguinte', () => {
    expect(calcularVencimentoDAS('2026-09-01')).toBe('2026-10-20')
  })

  it('vira o ano corretamente em dezembro', () => {
    expect(calcularVencimentoDAS('2026-12-01')).toBe('2027-01-20')
  })
})

describe('calcularDasDoMes', () => {
  // Construtor local (ano, mêsIndex0, dia) de propósito — new Date('YYYY-MM-DD')
  // é interpretado como UTC pelo JS e pode virar o dia errado dependendo do
  // fuso de quem roda o teste; o app em produção sempre recebe "hoje" via
  // `new Date()` no client (fuso real do usuário), não string ISO.
  it('calcula o DAS do mês usando o faturamento real lançado', () => {
    const r = calcularDasDoMes(entries, '2026-01-01', 'III', new Date(2026, 0, 10))
    expect(r.faturamentoMensal).toBe(4000)
    expect(r.valorDas).toBeGreaterThan(0)
    expect(r.vencimento).toBe('2026-02-20')
  })

  it('devolve 0 quando não há lançamento para a competência', () => {
    const r = calcularDasDoMes(entries, '2026-03-01', 'III', new Date(2026, 2, 10))
    expect(r.faturamentoMensal).toBe(0)
    expect(r.valorDas).toBe(0)
  })

  it('calcula dias para vencer em relação a "hoje"', () => {
    const r = calcularDasDoMes(entries, '2026-01-01', 'III', new Date(2026, 1, 15))
    // vencimento 2026-02-20, hoje 2026-02-15 -> 5 dias
    expect(r.diasParaVencer).toBe(5)
  })

  it('acusa vencido quando a data já passou', () => {
    const r = calcularDasDoMes(entries, '2026-01-01', 'III', new Date(2026, 2, 1))
    expect(r.diasParaVencer).toBeLessThan(0)
  })
})

describe('competenciaAtual', () => {
  it('devolve o primeiro dia do mês corrente', () => {
    expect(competenciaAtual(new Date('2026-09-15'))).toBe('2026-09-01')
  })
})
