'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, X } from 'lucide-react'

const STORAGE_KEY = 'meusalario-dashboard-updates-banner-dismissed'

export function DashboardUpdatesBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (dismissed === null || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/10 border-l-4 border-l-emerald-500 bg-[#0f1412]/90 pl-4 pr-10 py-4">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
        aria-label="Fechar aviso de atualizações"
      >
        <X size={18} />
      </button>
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Megaphone size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">Atualizações & Feedback</h2>
          <p className="mt-1 text-sm text-slate-400">
            Acompanhe as novidades mais recentes e envie sugestões direto pelo formulário integrado.
          </p>
          <Link
            href="/app/atualizacoes"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            Ver atualizações
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
