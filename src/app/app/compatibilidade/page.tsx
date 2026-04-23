import { CompatibilityForm } from '@/components/simulations/CompatibilityForm'
import { SimulationDisclaimer } from '@/components/ui/SimulationDisclaimer'
import { requireUser } from '@/lib/auth/profile'

export default async function CompatibilidadePage() {
  const profile = await requireUser()
  const isPro = profile.plan === 'pro'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Compatibilidade Salarial</h1>
        <p className="text-sm text-slate-300">
          Essa proposta cobre meus custos mensais? Simule salário, benefícios e custo de vida para ver o saldo real.
        </p>
      </div>

      <SimulationDisclaimer />

      <CompatibilityForm
        quota={{
          isPro,
          compatibilityRemaining: profile.compatibility_checks_remaining,
        }}
      />
    </div>
  )
}
