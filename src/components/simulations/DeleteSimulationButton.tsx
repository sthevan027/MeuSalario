'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSimulation } from '@/app/app/actions'
import { Trash2 } from 'lucide-react'

export function DeleteSimulationButton({ simulationId }: { simulationId: string }) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    startTransition(async () => {
      const result = await deleteSimulation(simulationId)
      if (result.ok) {
        setShowConfirm(false)
        // Atualiza a página sem reload completo
        router.refresh()
      } else {
        alert(result.message)
        setShowConfirm(false)
      }
    })
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
        >
          {isPending ? 'Excluindo...' : 'Confirmar'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-lg bg-slate-700/50 px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700/70 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400 disabled:opacity-50"
      title="Excluir simulação"
    >
      <Trash2 size={16} />
    </button>
  )
}
