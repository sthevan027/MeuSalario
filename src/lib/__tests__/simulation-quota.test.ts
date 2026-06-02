import { describe, it, expect } from 'vitest'
import { planToApiType, buildUsageResponse } from '../simulation-quota'

describe('planToApiType', () => {
  it('converte pro para premium', () => {
    expect(planToApiType('pro')).toBe('premium')
  })

  it('converte free para free', () => {
    expect(planToApiType('free')).toBe('free')
  })
})

describe('buildUsageResponse', () => {
  it('retorna unlimited=true e campos null para usuário pro', () => {
    const res = buildUsageResponse({
      plan: 'pro',
      simulations_remaining: 0,
      comparisons_remaining: 0,
      compatibility_checks_remaining: 0,
    })

    expect(res.unlimited).toBe(true)
    expect(res.plan_type).toBe('premium')
    expect(res.simulations_remaining).toBeNull()
    expect(res.comparisons_remaining).toBeNull()
    expect(res.compatibility_checks_remaining).toBeNull()
  })

  it('retorna unlimited=false e valores reais para usuário free', () => {
    const res = buildUsageResponse({
      plan: 'free',
      simulations_remaining: 3,
      comparisons_remaining: 2,
      compatibility_checks_remaining: 1,
    })

    expect(res.unlimited).toBe(false)
    expect(res.plan_type).toBe('free')
    expect(res.simulations_remaining).toBe(3)
    expect(res.comparisons_remaining).toBe(2)
    expect(res.compatibility_checks_remaining).toBe(1)
  })

  it('retorna zeros quando free sem cotas restantes', () => {
    const res = buildUsageResponse({
      plan: 'free',
      simulations_remaining: 0,
      comparisons_remaining: 0,
      compatibility_checks_remaining: 0,
    })

    expect(res.unlimited).toBe(false)
    expect(res.simulations_remaining).toBe(0)
    expect(res.comparisons_remaining).toBe(0)
    expect(res.compatibility_checks_remaining).toBe(0)
  })

  it('passa quota_reset_at quando presente', () => {
    const resetAt = '2026-05-01T00:00:00.000Z'
    const res = buildUsageResponse({
      plan: 'free',
      simulations_remaining: 5,
      comparisons_remaining: 2,
      compatibility_checks_remaining: 2,
      quota_reset_at: resetAt,
    })

    expect(res.quota_reset_at).toBe(resetAt)
  })

  it('retorna quota_reset_at null quando ausente', () => {
    const res = buildUsageResponse({
      plan: 'free',
      simulations_remaining: 5,
      comparisons_remaining: 2,
      compatibility_checks_remaining: 2,
    })

    expect(res.quota_reset_at).toBeNull()
  })
})
