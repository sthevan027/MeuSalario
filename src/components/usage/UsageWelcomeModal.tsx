'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Props = {
  open: boolean
  simulations: number
  comparisons: number
  compatibility: number
  onContinue: () => void
  onGetMore: () => void
}

export function UsageWelcomeModal({
  open,
  simulations,
  comparisons,
  compatibility,
  onContinue,
  onGetMore,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const urgent = simulations <= 1 || comparisons <= 1 || compatibility <= 1

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
          Seus limites no plano FREE
        </h2>

        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>
            <strong className="text-white">{simulations}</strong> simulações salvas no histórico (mensal, 13º,
            férias, rescisão)
          </li>
          <li>
            <strong className="text-white">{comparisons}</strong> comparações CLT × PJ salvas
          </li>
          <li>
            <strong className="text-white">{compatibility}</strong> análises de compatibilidade salarial
          </li>
        </ul>

        <p className="mt-3 text-sm text-slate-500">
          Todas as telas estão liberadas; os números acima voltam ao topo após cada uso. No Pro, tudo é
          ilimitado.
        </p>

        {urgent ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Algum limite está baixo — considere o Pro ou créditos avulsos quando disponíveis.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onContinue}>
            Continuar
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={onGetMore}>
            Ver planos / Pro
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
