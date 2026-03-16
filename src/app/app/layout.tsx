import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { requireUser } from '@/lib/auth/profile'
import { NavLink } from '@/components/layout/NavLink'
import { CollapsibleNavGroup } from '@/components/layout/CollapsibleNavGroup'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { User, Crown, LogOut, Shield } from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/app/dashboard',
    iconName: 'dashboard' as const,
    free: true, // Disponível para Free
  },
  {
    name: 'Histórico',
    href: '/app/historico',
    iconName: 'history' as const,
    free: false, // Pro only
  },
  {
    name: 'CLT x PJ',
    href: '/app/comparador',
    iconName: 'scale' as const,
    free: false, // Pro only
  },
  {
    name: 'Atualizações',
    href: '/app/atualizacoes',
    iconName: 'fileText' as const,
    free: true, // Disponível para Free e Pro
  },
]

// Grupo de simulações (expansível)
const simulationGroup = {
  title: 'Simulação',
  iconName: 'calculator' as const,
  items: [
    {
      name: 'Salário Mensal',
      href: '/app/simulacao',
      iconName: 'calculator' as const,
      free: true,
    },
    {
      name: '13º Salário',
      href: '/app/decimo-terceiro',
      iconName: 'calculator' as const,
      free: false, // Pro only
    },
    {
      name: 'Férias',
      href: '/app/ferias',
      iconName: 'calculator' as const,
      free: false, // Pro only
    },
    {
      name: 'Rescisão',
      href: '/app/rescisao',
      iconName: 'fileText' as const,
      free: false, // Pro only
    },
  ],
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()
  const isPro = profile.plan === 'pro'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Menu */}
      <MobileMenu
        isPro={isPro}
        isAdmin={isAdmin}
        userName={profile.name || profile.email?.split('@')[0] || 'Usuário'}
        userEmail={profile.email || ''}
        navigation={navigation}
        simulationGroup={simulationGroup}
        signOutAction={signOut}
      />

      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <Link href={isPro ? "/app/dashboard" : "/app/simulacao"} className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">Meu</span>
              <span className="text-slate-100">Salario</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const canAccess = item.free || isPro

              if (!canAccess) return null // Não mostra o link se não tiver acesso

              return (
                <NavLink key={item.name} href={item.href} iconName={item.iconName}>
                  {item.name}
                </NavLink>
              )
            })}

            {/* Grupo de Simulações (expansível) */}
            <CollapsibleNavGroup
              title={simulationGroup.title}
              iconName={simulationGroup.iconName}
              items={simulationGroup.items}
              isPro={isPro}
            />

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
        <div className="mx-auto max-w-7xl p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  )
}

