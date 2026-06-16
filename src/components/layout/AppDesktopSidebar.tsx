'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  History,
  LayoutGrid,
  LogOut,
  Shield,
  Sparkles,
  User,
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { APP_SIMULATION_ITEMS, isAppSimulationPath } from '@/lib/navigation/app-navigation'
import type { AppAuthenticatedShellProps } from '@/components/layout/AppAuthenticatedShell'

type Props = Pick<AppAuthenticatedShellProps, 'profile' | 'isPro' | 'isAdmin'>

const STORAGE_EXPANDED = 'meusalario-app-sidebar-expanded'

export function AppDesktopSidebar({ profile, isPro, isAdmin }: Props) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const [simGroupOpen, setSimGroupOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = window.localStorage.getItem(STORAGE_EXPANDED)
    if (v === '0') setExpanded(false)
  }, [])

  useEffect(() => {
    if (isAppSimulationPath(pathname)) {
      setSimGroupOpen(!expanded ? false : true)
    } else {
      setSimGroupOpen(false)
    }
  }, [pathname, expanded])

  const persistExpanded = (next: boolean) => {
    setExpanded(next)
    try {
      window.localStorage.setItem(STORAGE_EXPANDED, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const rail = !expanded
  const widthClass = rail ? 'lg:w-[4.5rem]' : 'lg:w-60'

  const simActive = isAppSimulationPath(pathname)

  return (
    <aside
      className={`relative z-30 hidden shrink-0 border-r border-white/10 bg-[#0a0a0a]/95 text-slate-200 backdrop-blur-xl lg:sticky lg:top-0 lg:flex ${widthClass} lg:h-[100dvh] lg:flex-col lg:transition-[width] lg:duration-200`}
      aria-label="Navegação do painel"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 pt-3">
          <div className={`mb-3 flex items-center ${rail ? 'justify-center' : 'justify-between px-1'}`}>
            {!rail && (
              <span className="pl-1 text-sm font-bold select-none">
                <span className="text-emerald-400">Meu</span>
                <span className="text-white">Salario</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => persistExpanded(!expanded)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              aria-expanded={expanded}
              aria-controls="app-sidebar-nav"
              title={expanded ? 'Recolher menu' : 'Expandir menu'}
            >
              {expanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
            </button>
          </div>

          <nav id="app-sidebar-nav" className="flex flex-col gap-1">
            <SidebarIconLink
              href="/app/dashboard"
              label="Início"
              rail={rail}
              isActive={pathname === '/app/dashboard'}
              activeVariant="square"
            >
              <LayoutGrid size={22} strokeWidth={2} />
            </SidebarIconLink>

            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setSimGroupOpen((o) => !o)}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium transition-colors ${
                  simActive || simGroupOpen ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                } ${rail ? 'justify-center' : ''}`}
                aria-expanded={simGroupOpen}
                aria-controls="app-sidebar-simular"
                title="Simular"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <Calculator size={22} strokeWidth={2} className="shrink-0" />
                </span>
                {!rail && (
                  <>
                    <span className="flex-1 leading-none">Simular</span>
                    {simGroupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </button>
              {simGroupOpen && !rail && (
                <div id="app-sidebar-simular" className="ml-1 space-y-0.5 border-l border-white/10 pl-2">
                  {APP_SIMULATION_ITEMS.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                          active ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon size={16} strokeWidth={2} className="shrink-0 opacity-80" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <SidebarIconLink
              href="/app/historico"
              label="Histórico"
              rail={rail}
              isActive={pathname === '/app/historico'}
            >
              <History size={22} strokeWidth={2} />
            </SidebarIconLink>

            <SidebarIconLink
              href="/app/atualizacoes"
              label="Novidades"
              rail={rail}
              isActive={pathname === '/app/atualizacoes'}
            >
              <Sparkles size={22} strokeWidth={2} />
            </SidebarIconLink>

            <SidebarIconLink href="/app/conta" label="Conta" rail={rail} isActive={pathname === '/app/conta'}>
              <User size={22} strokeWidth={2} />
            </SidebarIconLink>

            {isAdmin && (
              <Link
                href="/admin"
                className={`mt-1 flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-violet-300 transition hover:bg-white/5 ${rail ? 'justify-center' : ''}`}
                title="Admin"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <Shield size={22} />
                </span>
                {!rail && <span className="truncate leading-none">Admin</span>}
              </Link>
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-white/10 p-2">
          {!isPro && !rail && (
            <div className="mb-2 px-1">
              <UpgradeButton />
            </div>
          )}
          {!rail && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/5 px-2 py-2">
              <div className="min-w-0 flex-1 truncate text-xs font-medium text-slate-100">
                {profile.name || profile.email?.split('@')[0] || 'Usuário'}
              </div>
              {isPro && (
                <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Crown size={10} />
                  PRO
                </div>
              )}
            </div>
          )}
          <form action={signOut}>
            <Button
              type="submit"
              variant="secondary"
              className={`w-full gap-2 border border-white/15 bg-white/10 text-xs text-slate-100 hover:bg-white/15 ${
                rail ? 'justify-center px-0' : 'justify-start'
              }`}
              title="Sair"
            >
              <LogOut size={16} className="text-rose-300" />
              {!rail && 'Sair'}
            </Button>
          </form>
        </div>
      </div>

      {rail && simGroupOpen && !isAppSimulationPath(pathname) && (
        <>
          <button
            type="button"
            className="fixed inset-y-0 right-0 z-[34] hidden bg-black/50 lg:block left-[4.5rem]"
            aria-label="Fechar menu Simular"
            onClick={() => setSimGroupOpen(false)}
          />
          <div
            className="fixed z-[35] hidden max-h-[70vh] w-56 flex-col overflow-y-auto rounded-xl border border-white/10 bg-slate-900/98 p-2 shadow-xl backdrop-blur-xl lg:flex left-[4.5rem] top-[5.5rem]"
            role="menu"
            id="app-sidebar-simular-flyout"
          >
            {APP_SIMULATION_ITEMS.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium ${
                    active ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-white/5'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setSimGroupOpen(false)}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </aside>
  )
}

function SidebarIconLink({
  href,
  children,
  label,
  rail,
  isActive,
  activeVariant = 'circle',
}: {
  href: string
  children: React.ReactNode
  label: string
  rail: boolean
  isActive: boolean
  activeVariant?: 'circle' | 'square'
}) {
  const activeSquare = isActive && activeVariant === 'square'
  const activeCircle = isActive && activeVariant === 'circle'

  return (
    <Link
      href={href}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors ${
        rail ? 'justify-center px-0' : 'px-2'
      } ${
        activeSquare
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
          : activeCircle
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className={`flex shrink-0 items-center justify-center ${activeSquare ? 'h-10 w-10 rounded-xl' : 'h-10 w-10'}`}>
        {children}
      </span>
      {!rail && <span className="truncate leading-none">{label}</span>}
    </Link>
  )
}
