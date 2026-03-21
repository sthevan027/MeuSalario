'use client'

import { useEffect, useState } from 'react'

export function RegisterSW() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
      } catch {
        // SW não suportado ou erro de registro
      }
    }

    register()
  }, [])

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-emerald-500/30 bg-slate-900/95 p-4 shadow-lg backdrop-blur-xl lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
      <p className="mb-2 text-sm font-medium text-slate-100">Nova versão disponível!</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        Atualizar
      </button>
    </div>
  )
}
