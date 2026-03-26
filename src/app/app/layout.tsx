import { requireUser } from '@/lib/auth/profile'
import { BottomNav } from '@/components/layout/BottomNav'
import { AppUsageExperience } from '@/components/usage/AppUsageExperience'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()
  const isPro = profile.plan === 'pro'

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AppUsageExperience
        isPro={isPro}
        simulationsRemaining={profile.simulations_remaining}
        comparisonsRemaining={profile.comparisons_remaining}
        compatibilityRemaining={profile.compatibility_checks_remaining}
      />

      {/* Bottom Nav - navegação principal (mobile e desktop) */}
      <BottomNav mobileOnly={false} />

      {/* Main content — espaço para BottomNav fixa (~72px + paddings + safe area) */}
      <main className="flex-1 overflow-x-hidden pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto max-w-7xl p-4 pt-6 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

