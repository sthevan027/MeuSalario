'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { UpgradeModal } from '@/components/billing/UpgradeModal'

export function UpgradeCta({
  label = 'Assinar Plano Pro',
  className = '',
}: {
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-600 ' +
          className
        }
      >
        <Crown size={18} />
        {label}
      </button>

      <UpgradeModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

