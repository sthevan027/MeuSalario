import { describe, expect, it } from 'vitest'
import { getServiceWorkerPath, PWA_CACHE_VERSION } from '@/lib/pwa'

describe('pwa helpers', () => {
  it('uses default cache version when not provided', () => {
    expect(getServiceWorkerPath()).toBe(`/sw.js?v=${PWA_CACHE_VERSION}`)
  })

  it('allows overriding cache version', () => {
    expect(getServiceWorkerPath('v2')).toBe('/sw.js?v=v2')
  })
})
