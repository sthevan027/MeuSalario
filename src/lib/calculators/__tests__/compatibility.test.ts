import { describe, it, expect } from 'vitest'
import { simulateSalaryFit } from '../compatibility'
import { EMPTY_LIFE_COST } from '../compatibility-types'

describe('simulateSalaryFit', () => {
  it('CLT sem benefícios - cenário confortável', () => {
    const result = simulateSalaryFit({
      contractType: 'clt',
      grossCompensation: 8000,
      lifeCost: {
        ...EMPTY_LIFE_COST,
        moradia: 2000,
        contasFixas: 500,
        alimentacao: 800,
        transporte: 400,
        saude: 200,
        dividas: 0,
        reservaDesejada: 500,
      },
    })
    expect(result.compatibilityStatus).toBe('confortavel')
    expect(result.compatibilityBalance).toBeGreaterThan(0)
  })

  it('CLT - cenário inviável', () => {
    const result = simulateSalaryFit({
      contractType: 'clt',
      grossCompensation: 3000,
      lifeCost: {
        ...EMPTY_LIFE_COST,
        moradia: 2500,
        contasFixas: 800,
        alimentacao: 1000,
      },
    })
    expect(result.compatibilityStatus).toBe('inviavel')
    expect(result.compatibilityBalance).toBeLessThan(0)
  })

  it('CLT com ticket reduz custo de alimentação', () => {
    const semTicket = simulateSalaryFit({
      contractType: 'clt',
      grossCompensation: 5000,
      lifeCost: {
        ...EMPTY_LIFE_COST,
        moradia: 1500,
        alimentacao: 600,
        reservaDesejada: 300,
      },
    })
    const comTicket = simulateSalaryFit({
      contractType: 'clt',
      grossCompensation: 5000,
      benefits: [
        {
          id: '1',
          type: 'vr',
          label: 'Vale Refeição',
          monthlyValue: 600,
          employeeDiscount: 0,
          netValue: 600,
          includeInComparison: true,
        },
      ],
      lifeCost: {
        ...EMPTY_LIFE_COST,
        moradia: 1500,
        alimentacao: 600,
        reservaDesejada: 300,
      },
    })
    expect(comTicket.availableIncome).toBeGreaterThan(semTicket.availableIncome)
    expect(comTicket.benefitsNetValue).toBe(600)
  })
})
