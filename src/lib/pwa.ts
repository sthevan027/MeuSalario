export const PWA_CACHE_VERSION = 'v1'

export function getServiceWorkerPath(version = PWA_CACHE_VERSION) {
  const params = new URLSearchParams({ v: version })
  return `/sw.js?${params.toString()}`
}
