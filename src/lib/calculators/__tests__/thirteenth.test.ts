import { describe, it, expect } from 'vitest'
import { simulateThirteenth } from '../thirteenth'

// INSS e IRRF são calculados sobre o valorBase (100% do 13º), não sobre a 2ª parcela (50%).
// Os descontos completos aparecem na 2ª parcela.

describe('simulateThirteenth', () => {
  describe('valor base proporcional', () => {
    it('deve calcular valorBase proporcional para 12 meses', () => {
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 12 })
      expect(result.valorBase).toBe(5000)
    })

    it('deve calcular valorBase proporcional para 6 meses', () => {
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 6 })
      expect(result.valorBase).toBe(2500)
    })

    it('deve calcular valorBase para 1 mês', () => {
      const result = simulateThirteenth({ salarioBase: 6000, mesesTrabalhados: 1 })
      expect(result.valorBase).toBeCloseTo(500, 2)
    })
  })

  describe('parcelas', () => {
    it('primeira parcela deve ser 50% do valorBase sem descontos', () => {
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 12 })
      expect(result.primeiraParcela).toBe(2500)
    })

    it('segunda parcela base deve ser 50% do valorBase', () => {
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 12 })
      expect(result.segundaParcelaBase).toBe(2500)
    })
  })

  describe('INSS e IRRF calculados sobre o total do 13º (não sobre a 2ª parcela)', () => {
    it('INSS deve ser calculado sobre o valorBase completo (salário R$5.000, 12 meses)', () => {
      // valorBase = 5000; INSS(5000) = 501.51 — não INSS(2500) = 200.69
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 12 })
      expect(result.inss).toBe(501.51)
    })

    it('IRRF deve ser 0 quando base (5000 - INSS) fica abaixo da isenção de R$5.000', () => {
      // valorBase = 5000; baseIRRF = 5000 - 501.51 = 4498.49 < 5000 → isento
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 12 })
      expect(result.irrf).toBe(0)
    })

    it('INSS deve ser calculado sobre valorBase proporcional (salário R$5.000, 6 meses)', () => {
      // valorBase = 2500; INSS(2500) = 200.69
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 6 })
      expect(result.inss).toBe(200.69)
    })

    it('deve calcular INSS e IRRF corretamente para salário alto (R$10.000, 12 meses)', () => {
      // valorBase = 10000; INSS = 988.09 (teto); base IRRF = 10000 - 988.09 = 9011.91 > 7786.72 → sem complemento
      // IRRF = 9011.91 * 27.5% - 908.73 = 1569.55
      const result = simulateThirteenth({ salarioBase: 10000, mesesTrabalhados: 12 })
      expect(result.inss).toBe(988.09)
      expect(result.irrf).toBe(1569.55)
    })

    it('segunda parcela líquida deve ser 50% valorBase menos INSS e IRRF', () => {
      // 5000 - 988.09 - 1569.55 = 2442.36
      const result = simulateThirteenth({ salarioBase: 10000, mesesTrabalhados: 12 })
      expect(result.segundaParcelaLiquida).toBeCloseTo(2442.36, 2)
    })
  })

  describe('total líquido', () => {
    it('total sem recebeu 1ª parcela deve ser primeira + segunda líquida', () => {
      const result = simulateThirteenth({ salarioBase: 5000, mesesTrabalhados: 12 })
      // 2500 + (2500 - 501.51) = 2500 + 1998.49 = 4498.49
      expect(result.totalLiquido).toBeCloseTo(4498.49, 2)
    })

    it('total com recebeuPrimeiraParcela=true deve ser somente a segunda parcela líquida', () => {
      const result = simulateThirteenth({
        salarioBase: 5000,
        mesesTrabalhados: 12,
        recebeuPrimeiraParcela: true,
      })
      expect(result.totalLiquido).toBe(result.segundaParcelaLiquida)
    })

    it('total para salário R$10.000 (12 meses) deve ser correto', () => {
      // 5000 + 2442.36 = 7442.36
      const result = simulateThirteenth({ salarioBase: 10000, mesesTrabalhados: 12 })
      expect(result.totalLiquido).toBeCloseTo(7442.36, 2)
    })
  })

  describe('dependentes', () => {
    it('dependentes devem reduzir o IRRF', () => {
      const semDep = simulateThirteenth({ salarioBase: 12000, mesesTrabalhados: 12, dependentes: 0 })
      const comDep = simulateThirteenth({ salarioBase: 12000, mesesTrabalhados: 12, dependentes: 2 })
      expect(comDep.irrf).toBeLessThan(semDep.irrf)
    })
  })

  describe('descontosSegundaParcela', () => {
    it('deve ser igual a INSS + IRRF', () => {
      const result = simulateThirteenth({ salarioBase: 10000, mesesTrabalhados: 12 })
      expect(result.descontosSegundaParcela).toBeCloseTo(result.inss + result.irrf, 2)
    })
  })
})
