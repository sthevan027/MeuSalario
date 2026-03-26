/**
 * Garante que o path de redirect é sempre relativo ao próprio app.
 * Previne open redirect: qualquer valor externo (ex.: https://evil.com) vira o fallback.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = '/app/dashboard'
): string {
  if (!raw) return fallback
  const s = String(raw).trim()
  if (!s.startsWith('/') || s.startsWith('//')) return fallback
  try {
    const url = new URL(s, 'http://localhost')
    if (url.hostname !== 'localhost') return fallback
    return url.pathname + (url.search || '') + (url.hash || '')
  } catch {
    return fallback
  }
}
