'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Shield, Crown, LogOut } from 'lucide-react'
import { AdminNavLink } from '@/components/layout/AdminNavLink'
import { Button } from '@/components/ui/Button'

type AdminMobileMenuProps = {
  isPro: boolean
  userName: string
  userEmail: string
  signOutAction: () => void
}

export function AdminMobileMenu({ isPro, userName, userEmail, signOutAction }: AdminMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Fecha menu ao navegar
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Bloqueia scroll quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Botão Hambúrguer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-slate-950/95 text-slate-100 backdrop-blur-xl lg:hidden"
        aria-label="Menu Admin"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Lateral Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-slate-950/98 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center border-b border-white/10 px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Admin</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <AdminNavLink href="/admin" iconName="dashboard">
              Dashboard
            </AdminNavLink>

            <AdminNavLink href="/admin/usuarios" iconName="users">
              Usuários
            </AdminNavLink>

            <AdminNavLink href="/admin/planos" iconName="package">
              Planos
            </AdminNavLink>

            <div className="my-3 border-t border-white/10" />

            {/* Voltar ao app */}
            <AdminNavLink href="/app/dashboard" iconName="arrowLeft" highlight>
              Voltar ao app
            </AdminNavLink>
          </nav>

          {/* User info & Logout */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-slate-100">{userName}</div>
              </div>
              {isPro && (
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-bold text-white">
                  <Crown size={12} />
                  PRO
                </div>
              )}
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" className="w-full justify-start gap-2">
                <LogOut size={16} />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
