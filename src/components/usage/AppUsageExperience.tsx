'use client'

import { useEffect, useState } from 'react'
import { SimulationQuotaBanner } from '@/components/usage/SimulationQuotaBanner'
import { UsageWelcomeModal } from '@/components/usage/UsageWelcomeModal'

const STORAGE_KEY = 'meusalario_usage_welcome_seen'

type Props = {
  isPro: boolean
  simulationsRemaining: number
  comparisonsRemaining: number
  compatibilityRemaining: number
}

export function AppUsageExperience({
  isPro,
  simulationsRemaining,
  comparisonsRemaining,
  compatibilityRemaining,
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

  const urgent =
    simulationsRemaining <= 1 || comparisonsRemaining <= 1 || compatibilityRemaining <= 1

  return (
    <>
      <SimulationQuotaBanner
        simulations={simulationsRemaining}
        comparisons={comparisonsRemaining}
        compatibility={compatibilityRemaining}
        urgent={urgent}
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
