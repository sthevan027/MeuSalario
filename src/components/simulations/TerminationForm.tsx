'use client'

import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { createTermination } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResultBreakdown } from '@/components/simulations/ResultBreakdown'
import { simulateTermination } from '@/lib/calculators/termination'
import { useMemo } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Calculando...' : 'Calcular e salvar'}
    </Button>
  )
}

export function TerminationForm() {
  const [state, formAction] = useFormState(createTermination, null)

  const preview = useMemo(() => {
    if (state && state.ok) return state.data.result
    return simulateTermination({
      salarioBase: 3000,
      mesesTrabalhadosNoAno: 6,
      avisoPrevioDias: 30,
      feriasVencidas: false,
      saldoFgtsMesesEstimado: 12,
    })
  }, [state])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-3">
        <Field label="Salário base">
          <Input name="salarioBase" type="text" inputMode="decimal" placeholder="Ex.: 3.500,00" required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Meses trabalhados no ano" hint="0 a 12">
            <Input name="mesesTrabalhadosNoAno" type="number" inputMode="decimal" step="1" defaultValue={6} />
          </Field>
          <Field label="Aviso prévio (dias)" hint="ex: 30">
            <Input name="avisoPrevioDias" type="number" inputMode="decimal" step="1" defaultValue={30} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <div>
            <div className="text-sm font-medium text-slate-100">Férias vencidas</div>
            <div className="text-xs text-slate-400">Considera 1 salário + 1/3</div>
          </div>
          <input
            name="feriasVencidas"
            type="checkbox"
            className="h-5 w-5 accent-sky-500"
            defaultChecked={false}
          />
        </div>

        <Field label="Meses para FGTS (estimativa)" hint="ex: 12">
          <Input name="saldoFgtsMesesEstimado" type="number" inputMode="decimal" step="1" defaultValue={12} />
        </Field>

        {state && !state.ok ? (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {state.message}
          </div>
        ) : null}

        <SubmitButton />
      </form>

      <ResultBreakdown title="Resultado da rescisão" totalLabel="Total estimado" total={preview.total} items={preview.items} />
    </div>
  )
}

