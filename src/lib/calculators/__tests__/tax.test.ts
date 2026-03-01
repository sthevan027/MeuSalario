import { describe, it, expect } from 'vitest'
import {
  calcularINSS,
  calcularIRRF,
  calcularDescontos,
  calcularDASSimplesNacional,
  calcularINSSProLabore,
  calcularIRRFProLabore,
  calcularDescontosPJ,
} from '../tax'

describe('calcularINSS', () => {
  it('deve retornar 0 para salário zero ou negativo', () => {
    expect(calcularINSS(0)).toBe(0)
    expect(calcularINSS(-1000)).toBe(0)
  })

  it('deve calcular INSS corretamente na primeira faixa (até R$ 1.621,00)', () => {
    const inss = calcularINSS(1621)
    expect(inss).toBe(121.57) // 1621 * 7.5% (arredondado)
  })

  it('deve calcular INSS progressivo na segunda faixa', () => {
    const inss = calcularINSS(2000)
    expect(inss).toBe(155.69)
  })

  it('deve calcular INSS progressivo na terceira faixa', () => {
    const inss = calcularINSS(4000)
    expect(inss).toBe(368.60)
  })

  it('deve respeitar o teto do INSS para salários altos', () => {
    const inss = calcularINSS(15000)
    expect(inss).toBe(988.09)
  })

  it('deve calcular INSS para salário mínimo 2026', () => {
    const inss = calcularINSS(1621)
    expect(inss).toBe(121.57)
  })
})

describe('calcularIRRF', () => {
  it('deve retornar 0 para base de cálculo zero ou negativa', () => {
    expect(calcularIRRF(0, 0)).toBe(0)
    expect(calcularIRRF(1000, 1500)).toBe(0)
  })

  it('deve retornar 0 para rendimentos até R$ 5.000 (isenção 2026)', () => {
    const inss = calcularINSS(5000)
    const irrf = calcularIRRF(5000, inss)
    expect(irrf).toBe(0)
  })

  it('deve calcular IRRF para rendimentos acima da isenção', () => {
    const inss = calcularINSS(8000)
    const irrf = calcularIRRF(8000, inss)
    expect(irrf).toBeGreaterThan(0)
  })

  it('deve considerar dedução por dependentes', () => {
    const inss = calcularINSS(10000)
    const irrfSemDep = calcularIRRF(10000, inss, 0)
    const irrfComDep = calcularIRRF(10000, inss, 2)
    expect(irrfComDep).toBeLessThan(irrfSemDep)
  })
})

describe('calcularDescontos', () => {
  it('deve retornar INSS, IRRF e total corretos', () => {
    const result = calcularDescontos(5000)
    expect(result.inss).toBeGreaterThan(0)
    expect(result.total).toBe(result.inss + result.irrf)
  })

  it('deve retornar valores zerados para salário zero', () => {
    const result = calcularDescontos(0)
    expect(result.inss).toBe(0)
    expect(result.irrf).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('calcularDASSimplesNacional', () => {
  it('deve retornar 0 para faturamento zero ou negativo', () => {
    expect(calcularDASSimplesNacional(0)).toBe(0)
    expect(calcularDASSimplesNacional(-1000)).toBe(0)
  })

  it('deve calcular DAS Anexo III para primeira faixa (até 180k/ano)', () => {
    const das = calcularDASSimplesNacional(10000, 'III')
    expect(das).toBe(600)
  })

  it('deve calcular DAS Anexo V corretamente', () => {
    const dasIII = calcularDASSimplesNacional(10000, 'III')
    const dasV = calcularDASSimplesNacional(10000, 'V')
    expect(dasV).toBeGreaterThan(dasIII)
  })

  it('deve considerar faturamento anual acumulado informado', () => {
    const dasAnualBaixo = calcularDASSimplesNacional(15000, 'III', 100000)
    const dasAnualAlto = calcularDASSimplesNacional(15000, 'III', 400000)
    expect(dasAnualAlto).not.toBe(dasAnualBaixo)
  })
})

describe('calcularINSSProLabore', () => {
  it('deve retornar 0 para pró-labore zero ou negativo', () => {
    expect(calcularINSSProLabore(0)).toBe(0)
    expect(calcularINSSProLabore(-1000)).toBe(0)
  })

  it('deve calcular 11% do pró-labore', () => {
    const inss = calcularINSSProLabore(5000)
    expect(inss).toBe(550)
  })

  it('deve respeitar o teto previdenciário', () => {
    const inss = calcularINSSProLabore(10000)
    expect(inss).toBe(932.31)
  })
})

describe('calcularIRRFProLabore', () => {
  it('deve retornar 0 para base de cálculo zero ou negativa', () => {
    expect(calcularIRRFProLabore(0, 0)).toBe(0)
    expect(calcularIRRFProLabore(1000, 1500)).toBe(0)
  })

  it('deve retornar 0 para pró-labore com base até R$ 5.000 (isenção 2026)', () => {
    const inss = calcularINSSProLabore(4000)
    const irrf = calcularIRRFProLabore(4000, inss)
    expect(irrf).toBe(0)
  })

  it('deve calcular IRRF para pró-labore alto', () => {
    const inss = calcularINSSProLabore(10000)
    const irrf = calcularIRRFProLabore(10000, inss)
    expect(irrf).toBeGreaterThan(0)
  })
})

describe('calcularDescontosPJ', () => {
  it('deve retornar todos os campos corretamente', () => {
    const result = calcularDescontosPJ(15000, 3000, 'III')
    expect(result).toHaveProperty('das')
    expect(result).toHaveProperty('inssProLabore')
    expect(result).toHaveProperty('irrfProLabore')
    expect(result).toHaveProperty('total')
    expect(result.total).toBe(result.das + result.inssProLabore + result.irrfProLabore)
  })

  it('deve calcular descontos diferentes para Anexo III e V', () => {
    const resultIII = calcularDescontosPJ(15000, 3000, 'III')
    const resultV = calcularDescontosPJ(15000, 3000, 'V')
    expect(resultV.das).toBeGreaterThan(resultIII.das)
    expect(resultV.inssProLabore).toBe(resultIII.inssProLabore)
    expect(resultV.irrfProLabore).toBe(resultIII.irrfProLabore)
  })
})
