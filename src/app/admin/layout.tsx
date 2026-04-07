import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { requireAdmin } from '@/lib/auth/profile'
import { isServiceRoleConfigured } from '@/lib/env'
import { AdminNavLink } from '@/components/layout/AdminNavLink'
import { AdminMobileMenu } from '@/components/layout/AdminMobileMenu'
import { Shield, LogOut, Crown } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()

  if (!isServiceRoleConfigured()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
          <h1 className="text-2xl font-semibold">Configuração necessária para o Admin</h1>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 backdrop-blur-sm">
            <p className="text-slate-300">
              Para usar o painel <code>/admin</code>, você precisa configurar{' '}
              <code className="text-slate-100">SUPABASE_SERVICE_ROLE_KEY</code> no arquivo{' '}
              <code className="text-slate-100">.env.local</code> e reiniciar o servidor.
            </p>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 space-y-2">
              <div>1) Copie <code>env.example</code> → <code>.env.local</code></div>
              <div>2) Preencha <code>SUPABASE_SERVICE_ROLE_KEY</code> (Service role do Supabase)</div>
              <div>3) Reinicie: <code>pnpm dev</code></div>
            </div>
            <Link
              href="/setup?next=/admin"
              className="inline-flex items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-50 hover:bg-sky-500/30"
            >
              Abrir página de setup
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const isPro = profile.plan === 'pro'

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Menu */}
      <AdminMobileMenu
        isPro={isPro}
        userName={profile.name || profile.email?.split('@')[0] || 'Admin'}
        userEmail={profile.email || ''}
        signOutAction={signOut}
      />

      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-white/10 px-6">
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
                <div className="truncate text-sm font-medium text-slate-100">
                  {profile.name || profile.email?.split('@')[0] || 'Usuário'}
                </div>
                <div className="truncate text-xs text-slate-400">{profile.email}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isPro && (
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    <Crown size={10} />
                    PRO
                  </div>
                )}
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                  <Shield size={10} />
                  ADMIN
                </div>
              </div>
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

