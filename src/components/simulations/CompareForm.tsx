'use client'

import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { createCompare } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResultBreakdown } from '@/components/simulations/ResultBreakdown'
import { compareCltVsPj } from '@/lib/calculators/compare'
import { useMemo } from 'react'
import { formatBRL } from '@/lib/format'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Comparando...' : 'Comparar e salvar'}
    </Button>
  )
}

export function CompareForm() {
  const [state, formAction] = useFormState(createCompare, null)

  const preview = useMemo(() => {
    if (state && state.ok) return state.data.result
    return compareCltVsPj({
      salarioBase: 3000,
      jornadaMensalHoras: 220,
      horas50: 0,
      horas100: 0,
      horas150: 0,
      atrasosHoras: 0,
      adicionaisPercentual: 0,
      descontosCltPercentual: 20,
      descontosPjPercentual: 10,
    })
  }, [state])

  return (
    <div className="space-y-6">
      <form action={formAction} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 lg:grid-cols-3">
        <Field label="Salário base">
          <Input name="salarioBase" type="text" inputMode="decimal" placeholder="Ex.: 3.500,00" required />
        </Field>
        <Field label="Jornada mensal (horas)">
          <Input name="jornadaMensalHoras" type="number" inputMode="decimal" step="1" defaultValue={220} />
        </Field>
        <Field label="Adicionais (%)">
          <Input name="adicionaisPercentual" type="text" inputMode="decimal" defaultValue="0" />
        </Field>

        <Field label="HE 50%">
          <Input name="horas50" type="text" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="HE 100%">
          <Input name="horas100" type="text" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="HE 150%">
          <Input name="horas150" type="text" inputMode="decimal" defaultValue="0" />
        </Field>

        <Field label="Atrasos/Faltas (horas)">
          <Input name="atrasosHoras" type="text" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="Descontos CLT (%)" hint="padrão: 20%">
          <Input name="descontosCltPercentual" type="text" inputMode="decimal" defaultValue="20" />
        </Field>
        <Field label="Impostos PJ (%)" hint="padrão: 10%">
          <Input name="descontosPjPercentual" type="text" inputMode="decimal" defaultValue="10" />
        </Field>

        {state && !state.ok ? (
          <div className="lg:col-span-3 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {state.message}
          </div>
        ) : null}

        <div className="lg:col-span-3">
          <SubmitButton />
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResultBreakdown title="CLT" totalLabel="Líquido CLT" total={preview.clt.liquido} items={preview.clt.items} />
        <ResultBreakdown title="PJ" totalLabel="Líquido PJ" total={preview.pj.liquido} items={preview.pj.items} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-300">Diferença (PJ - CLT)</p>
        <p className="text-2xl font-semibold tabular-nums text-slate-50">{formatBRL(preview.deltaLiquido)}</p>
      </div>
    </div>
  )
}

