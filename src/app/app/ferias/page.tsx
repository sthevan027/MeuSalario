import { VacationForm } from '@/components/simulations/VacationForm'
import { SimulationDisclaimer } from '@/components/ui/SimulationDisclaimer'
import { requireUser } from '@/lib/auth/profile'

export default async function FeriasPage() {
  await requireUser()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Férias</h1>
        <p className="text-sm text-slate-300">
          Simule o cálculo de férias vencidas e proporcionais com 1/3 constitucional.
        </p>
      </div>

      <SimulationDisclaimer />

      <VacationForm />
    </div>
  )
}
