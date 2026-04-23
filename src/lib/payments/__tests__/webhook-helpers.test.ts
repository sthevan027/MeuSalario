import { describe, it, expect } from 'vitest'
import { mapWebhookStatus, planFromWebhookStatus } from '../webhook-helpers'

describe('mapWebhookStatus', () => {
  it('mapeia ACTIVE para active', () => {
    expect(mapWebhookStatus('ACTIVE')).toBe('active')
  })

  it('mapeia PENDING para trialing', () => {
    expect(mapWebhookStatus('PENDING')).toBe('trialing')
  })

  it('mapeia OVERDUE para past_due', () => {
    expect(mapWebhookStatus('OVERDUE')).toBe('past_due')
  })

  it('mapeia CANCELED para canceled', () => {
    expect(mapWebhookStatus('CANCELED')).toBe('canceled')
  })

  it('mapeia status desconhecido para none', () => {
    expect(mapWebhookStatus('UNKNOWN')).toBe('none')
    expect(mapWebhookStatus('')).toBe('none')
    expect(mapWebhookStatus('EXPIRED')).toBe('none')
  })
})

describe('planFromWebhookStatus', () => {
  it('retorna pro para active', () => {
    expect(planFromWebhookStatus('active')).toBe('pro')
  })

  it('retorna pro para trialing', () => {
    expect(planFromWebhookStatus('trialing')).toBe('pro')
  })

  it('retorna free para past_due', () => {
    expect(planFromWebhookStatus('past_due')).toBe('free')
  })

  it('retorna free para canceled', () => {
    expect(planFromWebhookStatus('canceled')).toBe('free')
  })

  it('retorna free para none', () => {
    expect(planFromWebhookStatus('none')).toBe('free')
  })

  it('garante consistência: ACTIVE → active → pro', () => {
    const mapped = mapWebhookStatus('ACTIVE')
    expect(planFromWebhookStatus(mapped)).toBe('pro')
  })

  it('garante consistência: CANCELED → canceled → free', () => {
    const mapped = mapWebhookStatus('CANCELED')
    expect(planFromWebhookStatus(mapped)).toBe('free')
  })

  it('garante consistência: OVERDUE → past_due → free', () => {
    const mapped = mapWebhookStatus('OVERDUE')
    expect(planFromWebhookStatus(mapped)).toBe('free')
  })
})
