'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Props = {
  open: boolean
  remaining: number
  onContinue: () => void
  onGetMore: () => void
}

export function UsageWelcomeModal({ open, remaining, onContinue, onGetMore }: Props) {
  const [mounted, setMounted] = useState(false)
  const urgent = remaining <= 1

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-welcome-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onContinue()
      }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
          urgent
            ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/90 to-slate-950'
            : 'border-white/10 bg-slate-950'
        }`}
      >
        <button
          type="button"
          onClick={onContinue}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
          <Calculator size={14} aria-hidden />
          Plano FREE
        </div>

        <h2 id="usage-welcome-title" className="text-xl font-bold text-white">
          Você ainda tem {remaining} {remaining === 1 ? 'simulação disponível' : 'simulações disponíveis'}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Cada simulação salva no histórico usa uma unidade. Acompanhe seu saldo no topo da tela.
        </p>

        {urgent ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Quase no limite — considere o Pro para simulações ilimitadas ou compre mais créditos.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onContinue}>
            Continuar
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={onGetMore}>
            Obter mais simulações
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
