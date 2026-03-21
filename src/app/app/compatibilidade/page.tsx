import { CompatibilityForm } from '@/components/simulations/CompatibilityForm'

export default function CompatibilidadePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Compatibilidade Salarial</h1>
        <p className="text-sm text-slate-300">
          Essa proposta cobre meus custos mensais? Simule salário, benefícios e custo de vida para ver o saldo real.
        </p>
      </div>

      <CompatibilityForm />
    </div>
  )
}
