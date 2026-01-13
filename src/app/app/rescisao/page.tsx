import { TerminationForm } from '@/components/simulations/TerminationForm'
import { requirePro } from '@/lib/auth/profile'

export default async function RescisaoPage() {
  await requirePro()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Simulador de rescisão</h1>
        <p className="text-sm text-slate-300">
          Estimativas configuráveis para aviso prévio, férias, 13º e multa do FGTS.
        </p>
      </div>

      <TerminationForm />
    </div>
  )
}

