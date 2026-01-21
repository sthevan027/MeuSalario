import { VacationForm } from '@/components/simulations/VacationForm'
import { requirePro } from '@/lib/auth/profile'

export default async function FeriasPage() {
  await requirePro()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Férias</h1>
        <p className="text-sm text-slate-300">
          Simule o cálculo de férias vencidas e proporcionais com 1/3 constitucional.
        </p>
      </div>

      <VacationForm />
    </div>
  )
}
