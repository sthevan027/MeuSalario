'use client'

import { Menu } from 'lucide-react'

interface MobileMenuButtonProps {
  onClick: () => void
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed left-4 top-4 z-50 rounded-lg bg-slate-900/90 p-2.5 text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-800/90 hover:text-white lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu size={24} />
    </button>
  )
}
