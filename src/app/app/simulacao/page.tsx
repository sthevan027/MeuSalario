import { MonthlySimulationForm } from '@/components/simulations/MonthlySimulationForm'

export default function SimulacaoPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Simulação mensal</h1>
        <p className="text-sm text-slate-300">
          Preencha os campos e salve a simulação para aparecer no seu histórico e nos gráficos.
        </p>
      </div>

      <MonthlySimulationForm />
    </div>
  )
}

