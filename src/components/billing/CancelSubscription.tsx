'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, X } from 'lucide-react'

export function CancelSubscription() {
  const [showCancel, setShowCancel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showRetention, setShowRetention] = useState(true)

  async function handleCancel(immediate: boolean, offerDiscount?: number) {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cancel_immediately: immediate,
          offer_discount: offerDiscount,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao cancelar assinatura')
      }

      const data = await res.json()

      if (offerDiscount && data.applied_discount) {
        setSuccess(`Desconto de ${data.applied_discount}% aplicado! Sua assinatura continua ativa.`)
        setShowCancel(false)
        setShowRetention(false)
      } else {
        setSuccess(data.message || 'Assinatura cancelada com sucesso.')
        setShowCancel(false)
      }

      // Recarrega a página após 2 segundos para atualizar o status
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cancelar assinatura')
      console.error('Cancel subscription error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!showCancel) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-red-500/5 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-white">Cancelar Assinatura</h3>
            <p className="mb-4 text-sm text-slate-300">
              Tem certeza que deseja cancelar? Você perderá acesso a todos os recursos Pro.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowCancel(true)}
          className="w-full border-rose-500/50 text-rose-400 hover:bg-rose-500/20"
        >
          Cancelar Assinatura
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-red-500/5 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-400" />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-white">Confirmar Cancelamento</h3>
            <p className="text-sm text-slate-300">
              Você perderá acesso a todos os recursos Pro após o cancelamento.
            </p>
          </div>
          <button
            onClick={() => setShowCancel(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {showRetention && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-3 text-sm font-medium text-amber-200">
              💡 Antes de cancelar, que tal um desconto especial?
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleCancel(false, 20)}
                disabled={loading}
                className="flex-1 border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
              >
                {loading ? 'Aplicando...' : 'Aceitar 20% de desconto'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleCancel(false, 30)}
                disabled={loading}
                className="flex-1 border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
              >
                {loading ? 'Aplicando...' : 'Aceitar 30% de desconto'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => handleCancel(false)}
            disabled={loading}
            className="w-full border-rose-500/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
          >
            {loading ? 'Cancelando...' : 'Cancelar no final do período'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleCancel(true)}
            disabled={loading}
            className="w-full border-rose-500/50 text-rose-400 hover:bg-rose-500/20"
          >
            {loading ? 'Cancelando...' : 'Cancelar imediatamente'}
          </Button>
        </div>
      </div>
    </div>
  )
}
