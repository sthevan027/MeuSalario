'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { NavLink } from '@/components/layout/NavLink'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { MobileMenu } from './MobileMenu'
import { MobileMenuButton } from './MobileMenuButton'
import { User, Crown, LogOut, Shield } from 'lucide-react'

interface AppLayoutClientProps {
  children: React.ReactNode
  profile: {
    name?: string | null
    email?: string | null
    plan: string
    role?: string | null
  }
  navigation: Array<{
    name: string
    href: string
    iconName: 'dashboard' | 'calculator' | 'history' | 'scale' | 'fileText'
    free: boolean
  }>
  isAdmin: boolean
  isPro: boolean
}

export function AppLayoutClient({ children, profile, navigation, isAdmin, isPro }: AppLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Menu Button */}
      <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:border-white/10 lg:bg-slate-950/95 lg:backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <Link href={isPro ? '/app/dashboard' : '/app/simulacao'} className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">Meu</span>
              <span className="text-slate-100">Salario</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const canAccess = item.free || isPro

              if (!canAccess) return null

              return (
                <NavLink key={item.name} href={item.href} iconName={item.iconName}>
                  {item.name}
                </NavLink>
              )
            })}

            {/* Admin (somente admins) */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-slate-100"
              >
                <Shield size={20} />
                Admin
              </Link>
            )}

            <div className="my-3 border-t border-white/10" />

            {/* Conta */}
            <Link
              href="/app/conta"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-slate-100"
            >
              <User size={20} />
              Conta
            </Link>
          </nav>

          {/* User info & Logout */}
          <div className="border-t border-white/10 p-4">
            {/* Upgrade to Pro - só aparece se não for Pro */}
            {!isPro && (
              <div className="mb-3">
                <UpgradeButton />
              </div>
            )}

            <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-slate-100">
                  {profile.name || profile.email?.split('@')[0] || 'Usuário'}
                </div>
                <div className="truncate text-xs text-slate-400">{profile.email}</div>
              </div>
              {isPro && (
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-bold text-white">
                  <Crown size={12} />
                  PRO
                </div>
              )}
            </div>
            <form action={signOut}>
              <Button type="submit" variant="secondary" className="w-full justify-start gap-2">
                <LogOut size={16} />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden lg:ml-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isPro={isPro}
        isAdmin={isAdmin}
        userName={profile.name || profile.email?.split('@')[0] || 'Usuário'}
        userEmail={profile.email || ''}
        navigation={navigation}
        signOutAction={signOut}
      />
    </div>
  )
}
