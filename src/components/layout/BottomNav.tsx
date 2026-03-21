'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calculator,
  Scale,
  Sparkles,
  User,
  ChevronUp,
} from 'lucide-react'

export type BottomNavProps = {
  isPro: boolean
}


const simulationItems = [
  { name: 'Salário Mensal', href: '/app/simulacao', free: true },
  { name: '13º Salário', href: '/app/decimo-terceiro', free: false },
  { name: 'Férias', href: '/app/ferias', free: false },
  { name: 'Rescisão', href: '/app/rescisao', free: false },
]

const simulationPaths = simulationItems.map((i) => i.href)

export function BottomNav({ isPro }: BottomNavProps) {
  const pathname = usePathname()
  const [simulacaoExpanded, setSimulacaoExpanded] = useState(false)

  const isSimulacaoActive = simulationPaths.some((p) => pathname === p)
  const isSimulacaoOpen = simulacaoExpanded || isSimulacaoActive

  return (
    <>
      {/* Bottom Navigation - apenas mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-slate-950/98 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
        role="navigation"
        aria-label="Navegação principal"
      >
        {/* Início - Dashboard para Pro, Simulação para Free */}
        <BottomNavLink
          href={isPro ? '/app/dashboard' : '/app/simulacao'}
          icon={LayoutDashboard}
          label="Início"
          isActive={
            pathname === '/app/dashboard' ||
            (pathname === '/app/simulacao' && !isPro)
          }
        />

        {/* Simular - expansível */}
        <div className="relative flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setSimulacaoExpanded(!simulacaoExpanded)}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors active:scale-95"
            aria-expanded={simulacaoExpanded}
            aria-haspopup="true"
            aria-label="Simulações"
          >
            <Calculator
              size={24}
              className={isSimulacaoActive ? 'text-emerald-400' : 'text-slate-400'}
            />
            <span
              className={`text-[10px] font-medium ${
                isSimulacaoActive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              Simular
            </span>
            <ChevronUp
              size={14}
              className={`mt-0.5 transition-transform ${simulacaoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Comparar */}
        <BottomNavLink
          href="/app/comparador"
          icon={Scale}
          label="Comparar"
          isActive={pathname === '/app/comparador'}
        />

        {/* Novidades */}
        <BottomNavLink
          href="/app/atualizacoes"
          icon={Sparkles}
          label="Novidades"
          isActive={pathname === '/app/atualizacoes'}
        />

        {/* Conta */}
        <BottomNavLink
          href="/app/conta"
          icon={User}
          label="Conta"
          isActive={pathname === '/app/conta'}
        />
      </nav>

      {/* Painel expansível de simulações */}
      {isSimulacaoOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSimulacaoExpanded(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-white/10 bg-slate-900/98 pb-[env(safe-area-inset-bottom)] pt-4 shadow-2xl lg:hidden"
            role="dialog"
            aria-label="Opções de simulação"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20" />
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Simulações
            </p>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              {simulationItems.map((item) => {
                const canAccess = item.free || isPro
                if (!canAccess) return null

                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSimulacaoExpanded(false)}
                    className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 transition-colors active:scale-[0.98] ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Calculator size={20} className="shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function BottomNavLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 transition-colors active:scale-95"
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        size={24}
        className={isActive ? 'text-emerald-400' : 'text-slate-400'}
      />
      <span
        className={`text-[10px] font-medium ${
          isActive ? 'text-emerald-400' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </Link>
  )
}
