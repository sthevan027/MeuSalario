import type { LucideIcon } from 'lucide-react'
import { Calculator, Calendar, FileText, Scale, Wallet } from 'lucide-react'

/** Rotas do painel Simular (BottomNav sheet + sidebar desktop). Fonte única — issue #34. */
export const APP_SIMULATION_ITEMS: ReadonlyArray<{
  name: string
  href: string
  icon: LucideIcon
}> = [
  { name: 'Salário Mensal', href: '/app/simulacao', icon: Calculator },
  { name: 'Compatibilidade', href: '/app/compatibilidade', icon: Wallet },
  { name: '13º Salário', href: '/app/decimo-terceiro', icon: Calendar },
  { name: 'Férias', href: '/app/ferias', icon: Calendar },
  { name: 'Rescisão', href: '/app/rescisao', icon: FileText },
  { name: 'CLT × PJ', href: '/app/comparador', icon: Scale },
]

export const APP_SIMULATION_PATHS = APP_SIMULATION_ITEMS.map((i) => i.href)

export function isAppSimulationPath(pathname: string): boolean {
  return APP_SIMULATION_PATHS.some((p) => p === pathname)
}
