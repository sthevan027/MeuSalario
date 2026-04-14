import { requireUser } from '@/lib/auth/profile'
import { AppUsageExperience } from '@/components/usage/AppUsageExperience'
import { AppAuthenticatedShell } from '@/components/layout/AppAuthenticatedShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()
  const isPro = profile.plan === 'pro'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AppUsageExperience
        isPro={isPro}
        simulationsRemaining={profile.simulations_remaining}
        comparisonsRemaining={profile.comparisons_remaining}
        compatibilityRemaining={profile.compatibility_checks_remaining}
      />

      <AppAuthenticatedShell profile={profile} isPro={isPro} isAdmin={isAdmin}>
        {children}
      </AppAuthenticatedShell>
    </div>
  )
}

