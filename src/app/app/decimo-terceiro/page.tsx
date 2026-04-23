import { ThirteenthForm } from '@/components/simulations/ThirteenthForm'
import { SimulationDisclaimer } from '@/components/ui/SimulationDisclaimer'
import { requireUser } from '@/lib/auth/profile'

export default async function DecimoTerceiroPage() {
  await requireUser()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">13º Salário</h1>
        <p className="text-sm text-slate-300">
          Simule o cálculo do 13º salário proporcional com descontos de INSS e IRRF.
        </p>
      </div>

      <SimulationDisclaimer />

      <ThirteenthForm />
    </div>
  )
}
