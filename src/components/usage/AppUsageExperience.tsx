'use client'

import { useEffect, useState } from 'react'
import { SimulationQuotaBanner } from '@/components/usage/SimulationQuotaBanner'
import { UsageWelcomeModal } from '@/components/usage/UsageWelcomeModal'
import { isQuotaResetDue } from '@/lib/simulation-quota'

const STORAGE_KEY = 'meusalario_usage_welcome_seen'

type Props = {
  isPro: boolean
  simulationsRemaining: number
  comparisonsRemaining: number
  compatibilityRemaining: number
  quotaResetAt: string | null
}

export function AppUsageExperience({
  isPro,
  simulationsRemaining,
  comparisonsRemaining,
  compatibilityRemaining,
  quotaResetAt,
}: Props) {
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    if (isPro) return
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    setWelcomeOpen(true)
  }, [isPro])

  if (isPro) {
    return null
  }

  // Quando o reset já venceu e todos os saldos estão em zero, não mostra urgente —
  // o próximo submit vai restaurar tudo automaticamente.
  const resetDue = isQuotaResetDue(quotaResetAt)
  const allExhausted =
    simulationsRemaining <= 0 && comparisonsRemaining <= 0 && compatibilityRemaining <= 0
  const urgent =
    !resetDue &&
    (simulationsRemaining <= 1 || comparisonsRemaining <= 1 || compatibilityRemaining <= 1) &&
    !allExhausted

  return (
    <>
      <SimulationQuotaBanner
        simulations={simulationsRemaining}
        comparisons={comparisonsRemaining}
        compatibility={compatibilityRemaining}
        urgent={urgent}
        quotaResetAt={quotaResetAt}
      />
      <UsageWelcomeModal
        open={welcomeOpen}
        simulations={simulationsRemaining}
        comparisons={comparisonsRemaining}
        compatibility={compatibilityRemaining}
        onContinue={() => {
          sessionStorage.setItem(STORAGE_KEY, '1')
          setWelcomeOpen(false)
        }}
        onGetMore={() => {
          sessionStorage.setItem(STORAGE_KEY, '1')
          setWelcomeOpen(false)
          window.location.href = '/planos'
        }}
      />
    </>
  )
}
