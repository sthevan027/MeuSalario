import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

describe('manifest', () => {
  it('returns standalone pwa configuration', () => {
    const result = manifest()

    expect(result.display).toBe('standalone')
    expect(result.start_url).toBe('/')
    expect(result.theme_color).toBe('#10b981')
    expect(result.icons?.length).toBeGreaterThan(0)
  })
})
