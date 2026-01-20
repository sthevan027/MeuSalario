'use client'

import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { createCompare } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResultBreakdown } from '@/components/simulations/ResultBreakdown'
import { compareCltVsPj } from '@/lib/calculators/compare'
import { useMemo, useState } from 'react'
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
  const [dependentes, setDependentes] = useState('0')
  const [usaCalculoRealPJ, setUsaCalculoRealPJ] = useState(false)
  const [proLabore, setProLabore] = useState('')
  const [anexoSimples, setAnexoSimples] = useState<'III' | 'V'>('III')

  const preview = useMemo(() => {
    if (state && state.ok) return state.data.result
    
    const proLaboreValue = proLabore ? parseFloat(proLabore) : undefined
    const usaCalculoReal = usaCalculoRealPJ && proLaboreValue !== undefined
    
    return compareCltVsPj({
      salarioBase: 3000,
      jornadaMensalHoras: 220,
      horas50: 0,
      horas100: 0,
      horas150: 0,
      atrasosHoras: 0,
      adicionaisPercentual: 0,
      dependentes: parseInt(dependentes) || 0,
      proLabore: usaCalculoReal ? proLaboreValue : undefined,
      anexoSimplesNacional: usaCalculoReal ? anexoSimples : undefined,
      descontosPjPercentual: !usaCalculoReal ? 10 : undefined,
    })
  }, [state, dependentes, usaCalculoRealPJ, proLabore, anexoSimples])

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
        <Field label="Dependentes (CLT)" hint="Reduz base do IRRF em R$ 189,59 por dependente">
          <Input
            name="dependentes"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            max="20"
            defaultValue="0"
            value={dependentes}
            onChange={(e) => setDependentes(e.target.value)}
          />
        </Field>
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usaCalculoRealPJ"
              checked={usaCalculoRealPJ}
              onChange={(e) => {
                setUsaCalculoRealPJ(e.target.checked)
                if (!e.target.checked) {
                  setProLabore('')
                }
              }}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="usaCalculoRealPJ" className="text-sm text-slate-300">
              Usar cálculo real de impostos PJ (Simples Nacional)
            </label>
          </div>

          {usaCalculoRealPJ ? (
            <div className="grid gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 lg:grid-cols-2">
              <Field label="Pró-labore" hint="Valor que você recebe como pró-labore da sua empresa">
                <Input
                  name="proLabore"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex.: 4.200,00"
                  value={proLabore}
                  onChange={(e) => setProLabore(e.target.value)}
                />
              </Field>
              <Field label="Anexo do Simples Nacional">
                <div className="relative">
                  <select
                    name="anexoSimplesNacional"
                    value={anexoSimples}
                    onChange={(e) => setAnexoSimples(e.target.value as 'III' | 'V')}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60 focus:bg-slate-800/50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="III" className="bg-slate-900 text-slate-100">
                      Anexo III - Serviços (~6% inicial)
                    </option>
                    <option value="V" className="bg-slate-900 text-slate-100">
                      Anexo V - Serviços profissionais (~15,5% inicial)
                    </option>
                  </select>
                </div>
              </Field>
            </div>
          ) : (
            <Field label="Impostos PJ (%)" hint="padrão: 10% (estimativa genérica)">
              <Input name="descontosPjPercentual" type="text" inputMode="decimal" defaultValue="10" />
            </Field>
          )}
        </div>

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

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Diferença (PJ - CLT)</p>
          <p className="text-2xl font-semibold tabular-nums text-slate-50">{formatBRL(preview.deltaLiquido)}</p>
        </div>
        <p className="text-[10px] text-slate-500">
          * Valores estimados. Podem variar conforme descontos específicos e convenções coletivas.
        </p>
      </div>
    </div>
  )
}

