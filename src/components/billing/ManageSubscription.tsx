'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { RefreshCw } from 'lucide-react'

type SubscriptionInfo = {
  id: string
  status: string
  current_period_end: number
  cancel_at_period_end: boolean
  trial_end: number | null
  items: Array<{ price_id: string; interval: string | null }>
}

export function ManageSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/billing/manage')
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao carregar assinatura')
      }
      
      const data = await res.json()
      setSubscription(data.subscription)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar assinatura')
      console.error('Load subscription error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function changeInterval(newInterval: 'month' | 'year') {
    try {
      setActionLoading('change_interval')
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'change_interval', interval: newInterval }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao alterar intervalo')
      }

      const data = await res.json()
      setSuccess(data.message || 'Intervalo alterado com sucesso!')
      await loadSubscription()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar intervalo')
      console.error('Change interval error:', e)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  const currentInterval = subscription.items[0]?.interval || 'month'
  const isCanceling = subscription.cancel_at_period_end
  const periodEnd = new Date(subscription.current_period_end * 1000)
  const isTrial = subscription.trial_end && subscription.trial_end * 1000 > Date.now()

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

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-white">Gerenciar Assinatura</h3>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-400">Plano Atual</div>
            <div className="text-sm font-medium text-white">
              Pro ({currentInterval === 'month' ? 'Mensal' : 'Anual'})
            </div>
          </div>

          {isTrial && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              ✨ Período de teste ativo até {new Date(subscription.trial_end! * 1000).toLocaleDateString('pt-BR')}
            </div>
          )}

          {isCanceling && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              ⚠️ Assinatura será cancelada em {periodEnd.toLocaleDateString('pt-BR')}
            </div>
          )}

          {!isCanceling && (
            <div>
              <div className="text-xs text-slate-400 mb-2">Alterar Intervalo</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={currentInterval === 'month' ? 'primary' : 'secondary'}
                  disabled={actionLoading !== null || currentInterval === 'month'}
                  onClick={() => changeInterval('month')}
                  className="flex-1"
                >
                  {actionLoading === 'change_interval' && currentInterval !== 'month' ? 'Alterando...' : 'Mensal'}
                </Button>
                <Button
                  type="button"
                  variant={currentInterval === 'year' ? 'primary' : 'secondary'}
                  disabled={actionLoading !== null || currentInterval === 'year'}
                  onClick={() => changeInterval('year')}
                  className="flex-1"
                >
                  {actionLoading === 'change_interval' && currentInterval !== 'year' ? 'Alterando...' : 'Anual (-17%)'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
