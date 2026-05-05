import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '../rate-limit'

// Limpa o store entre testes usando chaves únicas por teste
let testKeyCounter = 0
function uniqueKey(prefix = 'test') {
  return `${prefix}:${++testKeyCounter}:${Date.now()}`
}

describe('checkRateLimit', () => {
  it('permite primeiras requisições dentro do limite', () => {
    const key = uniqueKey()
    const result = checkRateLimit(key, { limit: 3, windowSeconds: 60 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('decrementa remaining a cada chamada', () => {
    const key = uniqueKey()
    const opts = { limit: 3, windowSeconds: 60 }
    checkRateLimit(key, opts)
    checkRateLimit(key, opts)
    const r = checkRateLimit(key, opts)
    expect(r.success).toBe(true)
    expect(r.remaining).toBe(0)
  })

  it('bloqueia quando limite é atingido', () => {
    const key = uniqueKey()
    const opts = { limit: 2, windowSeconds: 60 }
    checkRateLimit(key, opts)
    checkRateLimit(key, opts)
    const r = checkRateLimit(key, opts)
    expect(r.success).toBe(false)
    expect(r.remaining).toBe(0)
  })

  it('limite exato: última requisição válida é permitida', () => {
    const key = uniqueKey()
    const opts = { limit: 1, windowSeconds: 60 }
    const r = checkRateLimit(key, opts)
    expect(r.success).toBe(true)
    expect(r.remaining).toBe(0)
  })

  it('reseta janela após expirar', () => {
    vi.useFakeTimers()
    const key = uniqueKey()
    const opts = { limit: 1, windowSeconds: 1 }
    checkRateLimit(key, opts)

    // Dentro da janela — bloqueado
    expect(checkRateLimit(key, opts).success).toBe(false)

    // Avança 2 segundos — janela expirou
    vi.advanceTimersByTime(2000)
    expect(checkRateLimit(key, opts).success).toBe(true)
    vi.useRealTimers()
  })

  it('chaves diferentes têm contadores independentes', () => {
    const opts = { limit: 1, windowSeconds: 60 }
    const k1 = uniqueKey('a')
    const k2 = uniqueKey('b')
    checkRateLimit(k1, opts)
    // k2 não foi atingido
    expect(checkRateLimit(k2, opts).success).toBe(true)
  })

  it('retorna resetAt no futuro', () => {
    const key = uniqueKey()
    const before = Date.now()
    const { resetAt } = checkRateLimit(key, { limit: 5, windowSeconds: 60 })
    expect(resetAt).toBeGreaterThan(before)
    expect(resetAt).toBeLessThanOrEqual(before + 60_000 + 10)
  })
})
