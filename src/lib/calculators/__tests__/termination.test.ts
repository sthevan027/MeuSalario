import { describe, it, expect } from 'vitest'
import { simulateTermination } from '../termination'
import type { TerminationInput } from '../types'

describe('simulateTermination', () => {
  const baseInput: TerminationInput = {
    salarioBase: 5000,
    mesesTrabalhadosNoAno: 6,
    avisoPrevioDias: 30,
    feriasVencidas: false,
    saldoFgtsMesesEstimado: 24,
    diasTrabalhadosNoMes: 15,
    tipoRescisao: 'sem_justa_causa',
  }

  describe('saldo de salário', () => {
    it('deve calcular saldo de salário proporcional aos dias trabalhados', () => {
      const result = simulateTermination({
        ...baseInput,
        diasTrabalhadosNoMes: 15,
      })
      const saldoSalario = result.items.find(i => i.key === 'saldo_salario')
      expect(saldoSalario?.amount).toBe(2500)
    })

    it('deve calcular saldo para mês completo', () => {
      const result = simulateTermination({
        ...baseInput,
        diasTrabalhadosNoMes: 30,
      })
      const saldoSalario = result.items.find(i => i.key === 'saldo_salario')
      expect(saldoSalario?.amount).toBe(5000)
    })
  })

  describe('aviso prévio', () => {
    it('deve calcular aviso prévio indenizado de 30 dias', () => {
      const result = simulateTermination({
        ...baseInput,
        avisoPrevioDias: 30,
      })
      const aviso = result.items.find(i => i.key === 'aviso')
      expect(aviso?.amount).toBe(5000)
    })

    it('deve calcular aviso prévio de 90 dias', () => {
      const result = simulateTermination({
        ...baseInput,
        avisoPrevioDias: 90,
      })
      const aviso = result.items.find(i => i.key === 'aviso')
      expect(aviso?.amount).toBe(15000)
    })

    it('deve retornar 0 se aviso prévio for 0 dias', () => {
      const result = simulateTermination({
        ...baseInput,
        avisoPrevioDias: 0,
      })
      const aviso = result.items.find(i => i.key === 'aviso')
      expect(aviso?.amount).toBe(0)
    })
  })

  describe('férias', () => {
    it('não deve incluir férias vencidas se não marcado e período < 12 meses', () => {
      const result = simulateTermination({
        ...baseInput,
        feriasVencidas: false,
        mesesPeriodoAquisitivo: 6,
      })
      const feriasVenc = result.items.find(i => i.key === 'ferias_venc')
      expect(feriasVenc).toBeUndefined()
    })

    it('deve incluir férias vencidas se marcado', () => {
      const result = simulateTermination({
        ...baseInput,
        feriasVencidas: true,
      })
      const feriasVenc = result.items.find(i => i.key === 'ferias_venc')
      expect(feriasVenc?.amount).toBe(6666.67)
    })

    it('deve calcular férias proporcionais', () => {
      const result = simulateTermination({
        ...baseInput,
        feriasVencidas: false,
        mesesPeriodoAquisitivo: 6,
      })
      const feriasProp = result.items.find(i => i.key === 'ferias_prop')
      expect(feriasProp?.amount).toBe(3333.33)
    })
  })

  describe('13º salário', () => {
    it('deve calcular 13º proporcional aos meses trabalhados no ano', () => {
      const result = simulateTermination({
        ...baseInput,
        mesesTrabalhadosNoAno: 6,
      })
      const decimo = result.items.find(i => i.key === '13_prop')
      expect(decimo?.amount).toBe(2500)
    })

    it('deve calcular 13º integral para 12 meses', () => {
      const result = simulateTermination({
        ...baseInput,
        mesesTrabalhadosNoAno: 12,
      })
      const decimo = result.items.find(i => i.key === '13_prop')
      expect(decimo?.amount).toBe(5000)
    })
  })

  describe('FGTS e multa', () => {
    it('deve calcular multa de 40% para demissão sem justa causa', () => {
      const result = simulateTermination({
        ...baseInput,
        tipoRescisao: 'sem_justa_causa',
        saldoFgtsMesesEstimado: 24,
      })
      const multaFgts = result.items.find(i => i.key === 'fgts_multa')
      expect(multaFgts?.amount).toBe(3840)
    })

    it('deve calcular multa de 20% para acordo', () => {
      const result = simulateTermination({
        ...baseInput,
        tipoRescisao: 'acordo',
        saldoFgtsMesesEstimado: 24,
      })
      const multaFgts = result.items.find(i => i.key === 'fgts_multa')
      expect(multaFgts?.amount).toBe(1920)
    })

    it('não deve ter multa para pedido de demissão', () => {
      const result = simulateTermination({
        ...baseInput,
        tipoRescisao: 'pedido_demissao',
      })
      const multaFgts = result.items.find(i => i.key === 'fgts_multa')
      expect(multaFgts).toBeUndefined()
    })

    it('não deve ter multa para justa causa', () => {
      const result = simulateTermination({
        ...baseInput,
        tipoRescisao: 'justa_causa',
      })
      const multaFgts = result.items.find(i => i.key === 'fgts_multa')
      expect(multaFgts).toBeUndefined()
    })
  })

  describe('totais', () => {
    it('deve calcular total bruto e líquido corretamente', () => {
      const result = simulateTermination(baseInput)
      expect(result.totalBruto).toBeDefined()
      expect(result.totalBruto!).toBeGreaterThan(0)
      expect(result.total).toBeGreaterThan(0)
      expect(result.total).toBeLessThanOrEqual(result.totalBruto!)
    })

    it('total líquido deve ser total bruto menos descontos', () => {
      const result = simulateTermination(baseInput)
      expect(result.totalBruto).toBeDefined()
      expect(result.totalDescontos).toBeDefined()
      expect(result.total).toBeCloseTo(result.totalBruto! - result.totalDescontos!, 2)
    })
  })

  describe('validação de inputs', () => {
    it('deve tratar salário zero ou negativo', () => {
      const result = simulateTermination({
        ...baseInput,
        salarioBase: 0,
      })
      expect(result.total).toBe(0)
    })

    it('deve limitar valores extremos', () => {
      const result = simulateTermination({
        ...baseInput,
        salarioBase: 2000000,
        mesesTrabalhadosNoAno: 50,
      })
      expect(result.totalBruto).toBeGreaterThan(0)
    })
  })
})
