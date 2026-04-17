'use client'

import { AppDesktopSidebar } from '@/components/layout/AppDesktopSidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export type AppAuthenticatedShellProps = {
  children: React.ReactNode
  profile: {
    name?: string | null
    email?: string | null
    plan: string
    role?: string | null
  }
  isPro: boolean
  isAdmin: boolean
}

/**
 * Shell da área autenticada `/app/*`: sidebar em `lg+`, BottomNav só em mobile.
 * Substitui o padrão antigo (BottomNav em todos os breakpoints). Issue #34.
 */
export function AppAuthenticatedShell({ children, profile, isPro, isAdmin }: AppAuthenticatedShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <AppDesktopSidebar profile={profile} isPro={isPro} isAdmin={isAdmin} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
          <div className="mx-auto max-w-7xl p-4 pt-6 sm:p-6 lg:p-8">{children}</div>
        </main>
        <BottomNav mobileOnly />
      </div>
    </div>
  )
}
