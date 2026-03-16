const CACHE_VERSION = 'meusalario-shell-v1'
const OFFLINE_URL = '/offline'
const STATIC_ASSETS = ['/', '/offline', '/manifest.webmanifest', '/icon.png', '/apple-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name)))
    }),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL)
        }

        return new Response('', { status: 504, statusText: 'Offline' })
      })
    }),
  )
})
