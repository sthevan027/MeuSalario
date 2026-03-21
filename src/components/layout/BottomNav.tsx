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
  Wallet,
  Calendar,
  FileText,
} from 'lucide-react'

export type BottomNavProps = {
  isPro: boolean
}

const simulationItems = [
  { name: 'Salário Mensal', href: '/app/simulacao', icon: Calculator, free: true },
  { name: 'Compatibilidade', href: '/app/compatibilidade', icon: Wallet, free: true },
  { name: '13º Salário', href: '/app/decimo-terceiro', icon: Calendar, free: false },
  { name: 'Férias', href: '/app/ferias', icon: Calendar, free: false },
  { name: 'Rescisão', href: '/app/rescisao', icon: FileText, free: false },
]

const simulationPaths = simulationItems.map((i) => i.href)

/** Altura do menu inferior em rem - usado para posicionar a aba acima dele */
const BOTTOM_NAV_HEIGHT_REM = 5

export function BottomNav({ isPro }: BottomNavProps) {
  const pathname = usePathname()
  const [simulacaoExpanded, setSimulacaoExpanded] = useState(false)

  const isSimulacaoActive = simulationPaths.some((p) => pathname === p)

  return (
    <>
      {/* Bottom Navigation - apenas mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-slate-950/98 backdrop-blur-xl pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
        role="navigation"
        aria-label="Navegação principal"
        style={{ minHeight: '64px' }}
      >
        <BottomNavLink
          href={isPro ? '/app/dashboard' : '/app/simulacao'}
          icon={LayoutDashboard}
          label="Início"
          isActive={
            pathname === '/app/dashboard' ||
            (pathname === '/app/simulacao' && !isPro)
          }
        />

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
              size={22}
              className={isSimulacaoActive ? 'text-emerald-400' : 'text-slate-400'}
            />
            <span
              className={`text-[10px] font-medium leading-tight ${
                isSimulacaoActive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              Simular
            </span>
            <ChevronUp
              size={12}
              className={`transition-transform duration-200 ${
                simulacaoExpanded ? 'rotate-180 text-emerald-400' : 'text-slate-500'
              }`}
            />
          </button>
        </div>

        <BottomNavLink
          href="/app/comparador"
          icon={Scale}
          label="Comparar"
          isActive={pathname === '/app/comparador'}
        />

        <BottomNavLink
          href="/app/atualizacoes"
          icon={Sparkles}
          label="Novidades"
          isActive={pathname === '/app/atualizacoes'}
        />

        <BottomNavLink
          href="/app/conta"
          icon={User}
          label="Conta"
          isActive={pathname === '/app/conta'}
        />
      </nav>

      {/* Aba de simulações - sobe acima do menu inferior */}
      {simulacaoExpanded && (
        <>
          <div
            className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSimulacaoExpanded(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 z-50 lg:hidden"
            style={{
              bottom: `calc(${BOTTOM_NAV_HEIGHT_REM}rem + env(safe-area-inset-bottom, 0px))`,
              maxHeight: '70vh',
            }}
            role="dialog"
            aria-label="Selecionar simulação"
          >
            <div className="mx-4 overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-slate-900 shadow-2xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-14 rounded-full bg-white/30" />
              </div>
              <h2 className="px-4 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Escolha a simulação
              </h2>
              <div className="grid grid-cols-2 gap-2 px-4 pb-6">
                {simulationItems.map((item) => {
                  const canAccess = item.free || isPro
                  if (!canAccess) return null

                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSimulacaoExpanded(false)}
                      className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 transition-all active:scale-[0.98] ${
                        isActive
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={20} className="shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
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
      className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors active:scale-95"
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        size={22}
        className={isActive ? 'text-emerald-400' : 'text-slate-400'}
      />
      <span
        className={`truncate text-[10px] font-medium leading-tight ${
          isActive ? 'text-emerald-400' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </Link>
  )
}
