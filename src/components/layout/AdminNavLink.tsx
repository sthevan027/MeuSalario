'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeft,
  Settings,
  Shield,
} from 'lucide-react'

const icons = {
  dashboard: LayoutDashboard,
  users: Users,
  package: Package,
  arrowLeft: ArrowLeft,
  settings: Settings,
  shield: Shield,
}

interface AdminNavLinkProps {
  href: string
  iconName: keyof typeof icons
  children: React.ReactNode
  highlight?: boolean
}

export function AdminNavLink({ href, iconName, children, highlight }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
  const Icon = icons[iconName]

  if (!Icon) {
    console.error(`Icon not found for iconName: ${iconName}`)
    return null
  }

  if (highlight) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
      >
        <Icon size={20} />
        {children}
      </Link>
    )
  }
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
          : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
      }`}
    >
      <Icon size={20} />
      {children}
    </Link>
  )
}
