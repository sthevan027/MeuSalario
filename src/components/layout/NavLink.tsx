'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calculator,
  History,
  Scale,
  FileText,
} from 'lucide-react'

const icons = {
  dashboard: LayoutDashboard,
  calculator: Calculator,
  history: History,
  scale: Scale,
  fileText: FileText,
}

interface NavLinkProps {
  href: string
  iconName: keyof typeof icons
  children: React.ReactNode
}

export function NavLink({ href, iconName, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  const Icon = icons[iconName]
  
  // Fallback se o ícone não for encontrado
  if (!Icon) {
    console.error(`Icon not found for iconName: ${iconName}`)
    return null
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
          : 'text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400'
      }`}
    >
      <Icon size={20} />
      {children}
    </Link>
  )
}
