'use client'

import { useMemo, useState } from 'react'
import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { createMonthlySimulation } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResultBreakdown } from '@/components/simulations/ResultBreakdown'
import { simulateMonthly } from '@/lib/calculators/monthly'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Calculando...' : 'Calcular e salvar'}
    </Button>
  )
}

export function MonthlySimulationForm() {
  const [state, formAction] = useFormState(createMonthlySimulation, null)
  const [contractType, setContractType] = useState<'clt' | 'pj'>('clt')
  const [adiantamentoDia, setAdiantamentoDia] = useState<15 | 20>(15)

  const defaults = useMemo(() => {
    return contractType === 'clt'
      ? { descontosPercentual: 20, jornadaMensalHoras: 220 }
      : { descontosPercentual: 10, jornadaMensalHoras: 220 }
  }, [contractType])

  // Preview: se já existe resultado salvo no state, mostramos ele; senão calculamos localmente com defaults
  const preview = useMemo(() => {
    if (state && state.ok) return state.data.result
    return simulateMonthly({
      contractType,
      salarioBase: 3000,
      jornadaMensalHoras: defaults.jornadaMensalHoras,
      horas50: 0,
      horas100: 0,
      horas150: 0,
      atrasosHoras: 0,
      adicionaisPercentual: 0,
      descontosPercentual: defaults.descontosPercentual,
      adiantamentoDia,
    })
  }, [state, contractType, defaults.jornadaMensalHoras, defaults.descontosPercentual, adiantamentoDia])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Contrato">
            <select
              name="contractType"
              value={contractType}
              onChange={(e) => setContractType(e.target.value as any)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/60 focus:bg-white/10"
            >
              <option value="clt">CLT</option>
              <option value="pj">PJ</option>
            </select>
          </Field>

          <Field label="Jornada mensal (horas)">
            <Input name="jornadaMensalHoras" type="text" inputMode="decimal" step="1" defaultValue={defaults.jornadaMensalHoras} />
          </Field>

          <Field label="Adiantamento (dia)">
            <select
              name="adiantamentoDia"
              value={adiantamentoDia}
              onChange={(e) => setAdiantamentoDia((e.target.value === '20' ? 20 : 15) as 15 | 20)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/60 focus:bg-white/10"
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </Field>
        </div>

        <Field label="Salário base">
          <Input name="salarioBase" type="text" inputMode="decimal" placeholder="Ex.: 3.500,00" required />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="HE 50%">
            <Input name="horas50" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
          <Field label="HE 100%">
            <Input name="horas100" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
          <Field label="HE 150%">
            <Input name="horas150" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Atrasos/Faltas (horas)">
            <Input name="atrasosHoras" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
          <Field label="Adicionais (%)" hint="ex: 30 = 30%">
            <Input name="adicionaisPercentual" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
        </div>

        <Field label="Descontos estimados (%)" hint={contractType === 'clt' ? 'padrão: 20%' : 'padrão: 10%'}>
          <Input name="descontosPercentual" type="text" inputMode="decimal" defaultValue={String(defaults.descontosPercentual)} />
        </Field>

        {state && !state.ok ? (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {state.message}
          </div>
        ) : null}

        <SubmitButton />
      </form>

      <ResultBreakdown
        title="Resultado"
        totalLabel="Salário líquido"
        total={preview.liquido}
        items={[
          ...preview.items,
          { key: 'bruto', label: 'Salário bruto (info)', amount: preview.bruto, kind: 'info' as const },
        ]}
      />
    </div>
  )
}

