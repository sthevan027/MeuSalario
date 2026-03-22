import { requireUser } from '@/lib/auth/profile'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()
  const isPro = profile.plan === 'pro'

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Bottom Nav - navegação principal (mobile e desktop) */}
      <BottomNav isPro={isPro} mobileOnly={false} />

      {/* Main content - padding bottom para BottomNav */}
      <main className="flex-1 overflow-x-hidden pb-20">
        <div className="mx-auto max-w-7xl p-4 pt-6 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

