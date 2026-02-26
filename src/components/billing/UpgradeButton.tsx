'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { UpgradeModal } from './UpgradeModal'

export function UpgradeButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 transition-all hover:shadow-lg hover:shadow-emerald-500/25"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-left">
            <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-50/90">
              <Crown size={14} />
              Plano Pro
            </div>
            <div className="text-lg font-bold text-white">R$ 10/mês</div>
          </div>
          <div className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            Assinar
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>

      <UpgradeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
