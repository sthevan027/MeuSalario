import { describe, it, expect } from 'vitest'
import { clampNumber, money } from '../utils'

describe('clampNumber', () => {
  it('deve retornar o valor se estiver dentro do range', () => {
    expect(clampNumber(50, 0, 100)).toBe(50)
    expect(clampNumber(0, 0, 100)).toBe(0)
    expect(clampNumber(100, 0, 100)).toBe(100)
  })

  it('deve retornar min se valor for menor que min', () => {
    expect(clampNumber(-10, 0, 100)).toBe(0)
    expect(clampNumber(-1000, 0, 100)).toBe(0)
  })

  it('deve retornar max se valor for maior que max', () => {
    expect(clampNumber(150, 0, 100)).toBe(100)
    expect(clampNumber(1000, 0, 100)).toBe(100)
  })

  it('deve retornar min para NaN', () => {
    expect(clampNumber(NaN, 0, 100)).toBe(0)
    expect(clampNumber(NaN, 50, 100)).toBe(50)
  })

  it('deve retornar min para Infinity', () => {
    expect(clampNumber(Infinity, 0, 100)).toBe(0)
    expect(clampNumber(-Infinity, 0, 100)).toBe(0)
  })
})

describe('money', () => {
  it('deve arredondar para 2 casas decimais', () => {
    expect(money(100.123)).toBe(100.12)
    expect(money(100.125)).toBe(100.13)
    expect(money(100.126)).toBe(100.13)
  })

  it('deve lidar com números inteiros', () => {
    expect(money(100)).toBe(100)
    expect(money(0)).toBe(0)
  })

  it('deve lidar com números negativos', () => {
    expect(money(-100.555)).toBe(-100.55)
  })

  it('deve lidar com problemas de ponto flutuante', () => {
    expect(money(0.1 + 0.2)).toBe(0.3)
  })

  it('deve manter precisão em cálculos monetários', () => {
    const valor1 = money(1234.567)
    const valor2 = money(9876.543)
    expect(valor1).toBe(1234.57)
    expect(valor2).toBe(9876.54)
  })
})
