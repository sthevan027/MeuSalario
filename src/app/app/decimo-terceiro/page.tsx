import { ThirteenthForm } from '@/components/simulations/ThirteenthForm'
import { requirePro } from '@/lib/auth/profile'

export default async function DecimoTerceiroPage() {
  await requirePro()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">13º Salário</h1>
        <p className="text-sm text-slate-300">
          Simule o cálculo do 13º salário proporcional com descontos de INSS e IRRF.
        </p>
      </div>

      <ThirteenthForm />
    </div>
  )
}
