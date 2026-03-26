'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Props = {
  open: boolean
  onClose: () => void
  onBuyPack: () => void
  onUpgrade: () => void
  title?: string
  description?: string
}

export function SimulationLimitModal({
  open,
  onClose,
  onBuyPack,
  onUpgrade,
  title = 'Você atingiu o limite do plano FREE',
  description = 'Faça upgrade para o Pro (uso ilimitado) ou adquira créditos quando o checkout estiver disponível.',
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mounted])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-limit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-950 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/25">
          <Lock size={14} aria-hidden />
          Limite atingido
        </div>

        <h2 id="usage-limit-title" className="text-xl font-bold text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onBuyPack}>
            Comprar mais simulações
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={onUpgrade}>
            Fazer upgrade de plano
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
