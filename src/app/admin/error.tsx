'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { captureException } from '@/lib/sentry'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, { tags: { area: 'admin' } })
  }, [error])

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-rose-400" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-100">Erro no painel admin</h2>
        <p className="text-sm text-slate-400">
          Ocorreu um erro inesperado no painel administrativo.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-slate-600">ID: {error.digest}</p>
        )}
      </div>
      <Button variant="secondary" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}
