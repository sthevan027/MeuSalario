'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
  /** Altura mínima do placeholder para evitar layout shift */
  minHeight?: number
}

/**
 * Só renderiza os filhos (ex.: gráfico Recharts) quando o container entra no viewport.
 * Reduz o First Load JS do dashboard ao adiar o carregamento do chunk do gráfico.
 */
export function LazyChart({ children, fallback, minHeight = 320 }: Props) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true)
      },
      { rootMargin: '80px', threshold: 0.01 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!inView) {
    return (
      <div
        ref={ref}
        style={{ minHeight }}
        className="flex items-center justify-center text-slate-500"
      >
        {fallback ?? 'Carregando gráfico...'}
      </div>
    )
  }

  return <div ref={ref}>{children}</div>
}
