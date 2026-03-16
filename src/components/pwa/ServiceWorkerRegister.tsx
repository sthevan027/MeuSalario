'use client'

import { useEffect } from 'react'
import { getServiceWorkerPath } from '@/lib/pwa'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register(getServiceWorkerPath())
      } catch {
        // Falha silenciosa para não afetar a experiência principal.
      }
    }

    void registerServiceWorker()
  }, [])

  return null
}
