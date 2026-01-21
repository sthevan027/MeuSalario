'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Calculator, LayoutDashboard, History, Scale, FileText } from 'lucide-react'

type NavItem = {
  name: string
  href: string
  iconName?: 'calculator' | 'history' | 'scale' | 'fileText' | 'dashboard'
  free: boolean
}

interface CollapsibleNavGroupProps {
  title: string
  iconName?: 'calculator' | 'history' | 'scale' | 'fileText' | 'dashboard'
  items: NavItem[]
  isPro: boolean
  defaultOpen?: boolean
}

export function CollapsibleNavGroup({ title, iconName = 'calculator', items, isPro, defaultOpen = false }: CollapsibleNavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const pathname = usePathname()

  // Verifica se algum item do grupo está ativo
  const isActive = items.some((item) => {
    const canAccess = item.free || isPro
    return canAccess && pathname === item.href
  })

  // Se algum item está ativo, abre o grupo automaticamente
  useEffect(() => {
    if (isActive && !isOpen) {
      setIsOpen(true)
    }
  }, [isActive, isOpen])

  const filteredItems = items.filter((item) => item.free || isPro)

  if (filteredItems.length === 0) return null

  const iconMap = {
    calculator: Calculator,
    dashboard: LayoutDashboard,
    history: History,
    scale: Scale,
    fileText: FileText,
  }

  const Icon = iconMap[iconName] || Calculator

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
        }`}
      >
        <Icon size={20} />
        <span className="flex-1 text-left">{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
          {filteredItems.map((item) => {
            const itemIsActive = pathname === item.href
            const ItemIcon = item.iconName ? (iconMap[item.iconName] || Calculator) : Calculator

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  itemIsActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                <ItemIcon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
