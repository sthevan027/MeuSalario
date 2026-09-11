import { describe, it, expect } from 'vitest'
import { calcularAlertaMei } from '../mei'

describe('calcularAlertaMei', () => {
  it('classifica como tranquilo abaixo de 75%', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 40_000,
      mesesComLancamento: 6,
      limiteAnual: 81_000,
      mesAtual: 6,
    })
    expect(r.status).toBe('tranquilo')
    expect(r.percentualUtilizado).toBeCloseTo(0.4938, 3)
  })

  it('classifica como atencao a partir de 75%', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 61_000,
      mesesComLancamento: 8,
      limiteAnual: 81_000,
      mesAtual: 8,
    })
    expect(r.status).toBe('atencao')
  })

  it('classifica como alerta a partir de 90%', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 73_000,
      mesesComLancamento: 9,
      limiteAnual: 81_000,
      mesAtual: 9,
    })
    expect(r.status).toBe('alerta')
  })

  it('classifica como estourado quando passa de 100%', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 85_000,
      mesesComLancamento: 10,
      limiteAnual: 81_000,
      mesAtual: 10,
    })
    expect(r.status).toBe('estourado')
    expect(r.restanteAnual).toBe(0)
    expect(r.insights.some((i) => i.includes('ultrapassou'))).toBe(true)
  })

  it('calcula o restante corretamente', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 30_000,
      mesesComLancamento: 5,
      limiteAnual: 81_000,
      mesAtual: 5,
    })
    expect(r.restanteAnual).toBe(51_000)
  })

  it('projeta estouro quando o ritmo mensal, extrapolado pro ano, passa do limite', () => {
    // 20k em 2 meses = 10k/mes de media -> projecao 120k, acima de 81k
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 20_000,
      mesesComLancamento: 2,
      limiteAnual: 81_000,
      mesAtual: 2,
    })
    expect(r.projecaoAnual).toBe(120_000)
    expect(r.vaiEstourarNoRitmoAtual).toBe(true)
  })

  it('nao projeta estouro quando o ritmo esta dentro do limite', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 10_000,
      mesesComLancamento: 2,
      limiteAnual: 81_000,
      mesAtual: 2,
    })
    expect(r.projecaoAnual).toBe(60_000)
    expect(r.vaiEstourarNoRitmoAtual).toBe(false)
  })

  it('sugere limite mensal pros meses restantes', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 60_000,
      mesesComLancamento: 6,
      limiteAnual: 81_000,
      mesAtual: 6,
    })
    // restam 21000 em 7 meses (jun a dez, inclusive) = 3000/mes
    expect(r.mesesRestantes).toBe(7)
    expect(r.limiteSugeridoPorMesRestante).toBe(3_000)
  })

  it('nunca deixa faturamento acumulado negativo', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: -100,
      mesesComLancamento: 0,
      limiteAnual: 81_000,
      mesAtual: 1,
    })
    expect(r.faturamentoAcumuladoAno).toBe(0)
    expect(r.status).toBe('tranquilo')
  })

  it('usa 81000 como limite padrao se vier zero/invalido', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 40_000,
      mesesComLancamento: 6,
      limiteAnual: 0,
      mesAtual: 6,
    })
    expect(r.limiteAnual).toBe(81_000)
  })

  it('nao divide por zero quando nao ha meses com lancamento', () => {
    const r = calcularAlertaMei({
      faturamentoAcumuladoAno: 0,
      mesesComLancamento: 0,
      limiteAnual: 81_000,
      mesAtual: 1,
    })
    expect(r.projecaoAnual).toBe(0)
    expect(r.vaiEstourarNoRitmoAtual).toBe(false)
  })
})
