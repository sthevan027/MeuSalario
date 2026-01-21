'use client'

import { useMemo, useState, useEffect } from 'react'
import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { createVacationSimulation } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResultBreakdown } from '@/components/simulations/ResultBreakdown'
import { simulateVacation } from '@/lib/calculators/vacation'
import { getLastSalaryBase } from '@/lib/last-salary'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Calculando...' : 'Calcular e salvar'}
    </Button>
  )
}

export function VacationForm() {
  const [state, formAction] = useFormState(createVacationSimulation, null)
  const [salarioBase, setSalarioBase] = useState('')
  const [mesesTrabalhados, setMesesTrabalhados] = useState('12')
  const [dependentes, setDependentes] = useState('0')
  const [temFeriasVencidas, setTemFeriasVencidas] = useState(false)

  // Busca o último salário base do histórico
  useEffect(() => {
    async function loadLastSalary() {
      const lastSalary = await getLastSalaryBase()
      if (lastSalary) {
        setSalarioBase(String(lastSalary))
      }
    }
    loadLastSalary()
  }, [])

  const preview = useMemo(() => {
    if (state && state.ok) return state.data.result

    return simulateVacation({
      salarioBase: parseFloat(salarioBase) || 3000,
      mesesTrabalhados: parseInt(mesesTrabalhados) || 12,
      dependentes: parseInt(dependentes) || 0,
      temFeriasVencidas,
    })
  }, [state, salarioBase, mesesTrabalhados, dependentes, temFeriasVencidas])

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-3">
        <Field label="Salário base">
          <Input
            name="salarioBase"
            type="text"
            inputMode="decimal"
            placeholder="Ex.: 3.500,00"
            value={salarioBase}
            onChange={(e) => setSalarioBase(e.target.value)}
            required
          />
        </Field>

        <Field label="Meses trabalhados" hint="Meses desde o último período aquisitivo de férias (0-12)">
          <Input
            name="mesesTrabalhados"
            type="number"
            inputMode="numeric"
            min="0"
            max="12"
            step="1"
            value={mesesTrabalhados}
            onChange={(e) => setMesesTrabalhados(e.target.value)}
            required
          />
        </Field>

        <Field label="Dependentes (IRRF)" hint="Reduz base do IRRF em R$ 189,59 por dependente">
          <Input
            name="dependentes"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            max="20"
            value={dependentes}
            onChange={(e) => setDependentes(e.target.value)}
          />
        </Field>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="temFeriasVencidas"
            name="temFeriasVencidas"
            checked={temFeriasVencidas}
            onChange={(e) => setTemFeriasVencidas(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
          <label htmlFor="temFeriasVencidas" className="text-sm text-slate-300">
            Tenho férias vencidas (período completo)
          </label>
        </div>

        {state && !state.ok ? (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {state.message}
          </div>
        ) : null}

        <SubmitButton />
      </form>

      <div className="space-y-4">
        <ResultBreakdown
          title="Férias"
          totalLabel="Total líquido"
          total={preview.totalLiquido}
          items={preview.items}
        />
        <p className="text-[10px] text-slate-500">
          * Valores estimados. Podem variar conforme descontos específicos da empresa.
        </p>
      </div>
    </div>
  )
}
