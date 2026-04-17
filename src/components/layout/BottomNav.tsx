'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  User,
  ChevronUp,
  History,
} from 'lucide-react'
import { APP_SIMULATION_ITEMS } from '@/lib/navigation/app-navigation'

export type BottomNavProps = {
  /** Se false, BottomNav também aparece no desktop (quando não há sidebar) */
  mobileOnly?: boolean
}

const simulationItems = APP_SIMULATION_ITEMS
const simulationPaths = simulationItems.map((i) => i.href)

/** Altura do menu inferior em rem - usado para posicionar a aba acima dele */
const BOTTOM_NAV_HEIGHT_REM = 5

/** Distância mínima de arrasto para fechar o modal */
const DRAG_CLOSE_THRESHOLD = 60

export function BottomNav({ mobileOnly = true }: BottomNavProps) {
  const pathname = usePathname()
  const [simulacaoExpanded, setSimulacaoExpanded] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef(0)
  const dragOffsetRef = useRef(0)

  const isSimulacaoActive = simulationPaths.some((p) => pathname === p)

  const isDragging = useRef(false)

  dragOffsetRef.current = dragOffset

  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY
    isDragging.current = true
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    const delta = clientY - dragStartY.current
    if (delta > 0) {
      setDragOffset(delta)
    } else {
      setDragOffset(delta * 0.3)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    const currentOffset = dragOffsetRef.current
    if (currentOffset > DRAG_CLOSE_THRESHOLD) {
      setSimulacaoExpanded(false)
    }
    setDragOffset(0)
    dragStartY.current = 0
    isDragging.current = false
  }, [])

  useEffect(() => {
    if (!simulacaoExpanded) return

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging.current) handleDragMove(e.clientY)
    }
    const onPointerUp = () => {
      if (isDragging.current) handleDragEnd()
    }

    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
    }
  }, [simulacaoExpanded, handleDragMove, handleDragEnd])

  const navBaseClass = 'fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3'
  const navClassName = mobileOnly ? `${navBaseClass} lg:hidden` : navBaseClass

  const isInicioActive = pathname === '/app/dashboard'

  return (
    <>
      {/* Bottom Navigation - só o retângulo arredondado */}
      <nav
        className={navClassName}
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="relative flex min-h-[72px] w-full max-w-2xl items-center justify-between rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl px-1 pt-3 pb-2 shadow-xl shadow-black/20">
          <BottomNavLink
            href="/app/dashboard"
            icon={LayoutDashboard}
            label="Início"
            isActive={isInicioActive}
            animationType="shimmer"
          />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setSimulacaoExpanded((prev) => !prev)
              }}
              className="group flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95"
              aria-expanded={simulacaoExpanded}
              aria-haspopup="true"
              aria-label="Simulações"
            >
              <div
                className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-visible rounded-full transition-all duration-200 ${
                  isSimulacaoActive || simulacaoExpanded
                    ? 'bg-emerald-500/30 backdrop-blur-sm ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : ''
                }`}
              >
                {(isSimulacaoActive || simulacaoExpanded) && (
                  <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                    <span
                      className="absolute inset-0 w-[60%] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-nav-shimmer"
                      style={{ left: '-30%' }}
                    />
                  </span>
                )}
                <Calculator
                  size={22}
                  className={`relative z-10 ${
                    isSimulacaoActive || simulacaoExpanded
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
              </div>
              <span className="flex h-4 items-center justify-center gap-0.5">
                <span
                  className={`text-center text-[10px] font-medium leading-tight ${
                    isSimulacaoActive || simulacaoExpanded
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  Simular
                </span>
                <ChevronUp
                  size={10}
                  className={`shrink-0 transition-transform duration-200 ${
                    simulacaoExpanded
                      ? 'rotate-180 text-emerald-400'
                      : 'text-slate-500'
                  }`}
                />
              </span>
            </button>
          </div>

          <BottomNavLink
            href="/app/historico"
            icon={History}
            label="Histórico"
            isActive={pathname === '/app/historico'}
            animationType="shimmer"
          />

          <BottomNavLink
            href="/app/atualizacoes"
            icon={Sparkles}
            label="Novidades"
            isActive={pathname === '/app/atualizacoes'}
            animationType="shimmer"
          />

          <BottomNavLink
            href="/app/conta"
            icon={User}
            label="Conta"
            isActive={pathname === '/app/conta'}
            animationType="shimmer"
          />
        </div>
      </nav>

      {/* Aba de simulações - sobe acima do menu inferior */}
      {simulacaoExpanded && (
        <>
          <div
            className={`fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${mobileOnly ? 'lg:hidden' : ''}`}
            style={{ opacity: 1 - Math.min(dragOffset / 200, 0.5) }}
            onClick={() => setSimulacaoExpanded(false)}
            aria-hidden="true"
          />
          <div
            className={`fixed inset-x-0 z-50 ${mobileOnly ? 'lg:hidden' : ''}`}
            style={{
              bottom: `calc(${BOTTOM_NAV_HEIGHT_REM}rem + env(safe-area-inset-bottom, 0px))`,
              maxHeight: '70vh',
            }}
            role="dialog"
            aria-label="Selecionar simulação"
          >
            <div
              className="mx-4 overflow-hidden rounded-t-3xl border border-b-0 border-white/15 bg-gradient-to-b from-slate-800/98 to-slate-900/98 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-150"
              style={{
                transform: `translateY(${dragOffset}px)`,
              }}
            >
              {/* Handle - área de arrasto */}
              <div
                className="flex cursor-grab touch-none flex-col items-center pt-4 pb-3 active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  handleDragStart(e.clientY)
                }}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
              >
                <div className="h-1.5 w-12 rounded-full bg-white/40 transition-colors group-hover:bg-white/50" />
              </div>

              <div className="px-5 pb-2">
                <h2 className="text-base font-semibold tracking-tight text-slate-200">
                  Simulações e comparador
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Histórico na barra ao lado. Arraste para baixo para fechar.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 px-5 pb-8">
                {simulationItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSimulacaoExpanded(false)}
                      className={`group flex min-h-[56px] items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-all duration-200 active:scale-[0.98] ${
                        isActive
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                          : 'border-white/10 bg-slate-800/50 text-slate-300 hover:border-emerald-500/20 hover:bg-slate-700/50 hover:text-slate-100'
                      }`}
                    >
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-xl p-2 transition-colors ${
                          isActive
                            ? 'bg-emerald-500/25 text-emerald-400'
                            : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-300'
                        }`}
                      >
                        <Icon size={20} strokeWidth={2} />
                      </div>
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
  animationType,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  animationType?: 'bounce' | 'shimmer'
}) {
  return (
    <Link
      href={href}
      className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95"
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-visible rounded-full transition-all duration-200 ${
          isActive
            ? 'bg-emerald-500/30 backdrop-blur-sm ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : ''
        } ${animationType === 'bounce' && isActive ? 'animate-nav-bounce' : ''}`}
      >
        {/* 9 - Shimmer */}
        {animationType === 'shimmer' && isActive && (
          <span
            key={href}
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          >
            <span
              className="absolute inset-0 w-[60%] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-nav-shimmer"
              style={{ left: '-30%' }}
            />
          </span>
        )}
        <Icon
          size={22}
          className={`relative z-10 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
        />
      </div>
      <span
        className={`flex h-4 items-center justify-center text-center text-[10px] font-medium leading-tight ${
          isActive ? 'text-emerald-400' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </Link>
  )
}
