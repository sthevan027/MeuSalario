'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

async function startCheckout(interval: 'month' | 'year') {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ interval }),
  })
  
  if (!res.ok) {
    const text = await res.text()
    let errorMsg = 'Falha ao iniciar checkout'
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
}

export function SubscribeButtons() {
  const [loading, setLoading] = useState<'month' | 'year' | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 md:flex-row">
        <Button
          type="button"
          className="w-full"
          disabled={loading !== null}
          onClick={async () => {
            try {
              setError(null)
              setLoading('month')
              await startCheckout('month')
            } catch (e: any) {
              setError(e?.message ?? 'Erro')
              setLoading(null)
            }
          }}
        >
          {loading === 'month' ? 'Abrindo...' : 'Assinar Pro (mensal)'}
        </Button>

        <div className="relative w-full">
          <Button
            type="button"
            className="w-full"
            variant="secondary"
            disabled={loading !== null}
            onClick={async () => {
              try {
                setError(null)
                setLoading('year')
                await startCheckout('year')
              } catch (e: any) {
                setError(e?.message ?? 'Erro')
                setLoading(null)
              }
            }}
          >
            {loading === 'year' ? 'Abrindo...' : 'Assinar Pro (anual)'}
          </Button>
          <div className="absolute -top-2 right-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            -17%
          </div>
        </div>
      </div>
    </div>
  )
}

