import { MonthlySimulationForm } from '@/components/simulations/MonthlySimulationForm'
import { requireUser } from '@/lib/auth/profile'

export default async function SimulacaoPage() {
  const profile = await requireUser()
  const isPro = profile.plan === 'pro'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Simulação mensal</h1>
        <p className="text-sm text-slate-300">
          Preencha os campos e salve a simulação para aparecer no seu histórico e nos gráficos.
        </p>
      </div>

      <MonthlySimulationForm
        quota={{
          isPro,
          simulationsRemaining: profile.simulations_remaining,
        }}
      />
    </div>
  )
}

