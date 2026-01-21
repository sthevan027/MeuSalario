'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Crown } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'month' | 'year' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Evita scroll do body quando o modal está aberto
  useEffect(() => {
    if (!mounted) return
    if (!isOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, mounted])

  // Importante: renderiza via portal no <body> para não ficar preso no sidebar
  // (o backdrop-blur cria containing block e "quebra" o fixed quando aninhado).
  if (!isOpen || !mounted) return null

  async function handleCheckout(interval: 'month' | 'year') {
    try {
      setError(null)
      setLoading(interval)
      
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interval }),
      })
      
      if (!res.ok) {
        const text = await res.text()
        let errorMsg = 'Erro ao processar pagamento'
        try {
          const data = JSON.parse(text)
          errorMsg = data?.error || errorMsg
        } catch {
          errorMsg = text || errorMsg
        }
        throw new Error(errorMsg)
      }
      
      const data = await res.json()
      if (!data?.url) throw new Error('Checkout sem URL.')
      
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message ?? 'Erro desconhecido')
      setLoading(null)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Assinar Plano Pro"
      onMouseDown={(e) => {
        // Fecha ao clicar no backdrop (mas não ao clicar dentro do conteúdo)
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-4 pr-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
            <Crown size={14} />
            Plano Pro
          </div>
          <h2 className="text-2xl font-bold text-white">Desbloqueie tudo</h2>
          <p className="mt-1 text-sm text-slate-400">
            Gráficos, histórico completo, comparador CLT x PJ e rescisão.
          </p>
        </div>

        {/* Features */}
        <div className="mb-5 grid gap-2 text-sm text-slate-300">
          {[
            'Dashboard com gráficos de evolução',
            'Histórico mensal ilimitado',
            'Comparador CLT x PJ',
            'Simulador de rescisão',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <Check size={16} className="text-emerald-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid gap-3">
          <button
            onClick={() => handleCheckout('month')}
            disabled={loading !== null}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-emerald-500/30 hover:bg-white/10 disabled:opacity-50"
          >
            <div>
              <div className="text-sm font-semibold text-white">Mensal</div>
              <div className="mt-0.5 text-xs text-slate-400">Cancele quando quiser</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">R$ 5,50</div>
              <div className="text-xs text-slate-400">por mês</div>
            </div>
          </button>

          <button
            onClick={() => handleCheckout('year')}
            disabled={loading !== null}
            className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-left hover:border-emerald-500/70 hover:bg-emerald-500/15 disabled:opacity-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-white">Anual</div>
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  Economize 17%
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">R$ 4,58/mês</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">R$ 55,00</div>
              <div className="text-xs text-slate-400">por ano</div>
            </div>
          </button>
        </div>

        {/* Nota */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Pagamento seguro via Asaas (Pix + Cartão)</span>
          <span>{loading ? 'Abrindo checkout...' : ''}</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
