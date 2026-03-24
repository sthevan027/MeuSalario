import { describe, it, expect } from 'vitest'
import { buildUsageResponse, planToApiType } from '@/lib/simulation-quota'

describe('simulation-quota', () => {
  it('buildUsageResponse: free retorna saldo', () => {
    const r = buildUsageResponse({
      plan: 'free',
      simulations_remaining: 2,
      comparisons_remaining: 1,
      compatibility_checks_remaining: 2,
    })
    expect(r.plan_type).toBe('free')
    expect(r.unlimited).toBe(false)
    expect(r.simulations_remaining).toBe(2)
    expect(r.comparisons_remaining).toBe(1)
    expect(r.compatibility_checks_remaining).toBe(2)
  })

  it('buildUsageResponse: pro é ilimitado na API', () => {
    const r = buildUsageResponse({
      plan: 'pro',
      simulations_remaining: 99,
      comparisons_remaining: 5,
      compatibility_checks_remaining: 5,
    })
    expect(r.plan_type).toBe('premium')
    expect(r.unlimited).toBe(true)
    expect(r.simulations_remaining).toBeNull()
    expect(r.comparisons_remaining).toBeNull()
    expect(r.compatibility_checks_remaining).toBeNull()
  })

  it('planToApiType', () => {
    expect(planToApiType('free')).toBe('free')
    expect(planToApiType('pro')).toBe('premium')
  })
})
