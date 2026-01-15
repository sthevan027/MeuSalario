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
  const [bonus, setBonus] = useState('0')
  
  // Estado para mês/ano da simulação (padrão: mês atual)
  const hoje = new Date()
  const defaultYear = hoje.getFullYear()
  const defaultMonth = hoje.getMonth() + 1 // getMonth retorna 0-11
  const [selectedYear, setSelectedYear] = useState<string>(String(defaultYear))
  const [selectedMonth, setSelectedMonth] = useState<string>(String(defaultMonth).padStart(2, '0'))

  const defaults: { jornadaMensalHoras: number; descontosPercentual?: number } = useMemo(() => {
    return contractType === 'clt'
      ? { jornadaMensalHoras: 220 }
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
      bonus: contractType === 'pj' ? parseFloat(bonus) || 0 : undefined,
      atrasosHoras: 0,
      adicionaisPercentual: 0,
      descontosPercentual: contractType === 'pj' ? defaults.descontosPercentual : undefined,
      adiantamentoDia: contractType === 'clt' ? adiantamentoDia : undefined,
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    })
  }, [state, contractType, defaults.jornadaMensalHoras, defaults.descontosPercentual, adiantamentoDia, bonus, selectedMonth, selectedYear])

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Contrato">
            <div className="relative">
              <select
                name="contractType"
                value={contractType}
                onChange={(e) => {
                  setContractType(e.target.value as any)
                  setBonus('0')
                }}
                className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-sky-400/60 focus:bg-slate-800/50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '12px'
                }}
              >
                <option value="clt" className="bg-slate-900 text-slate-100">CLT</option>
                <option value="pj" className="bg-slate-900 text-slate-100">PJ</option>
              </select>
            </div>
          </Field>

          {contractType === 'clt' ? (
            <Field label="Adiantamento (dia)">
              <div className="relative">
                <select
                  name="adiantamentoDia"
                  value={adiantamentoDia}
                  onChange={(e) => setAdiantamentoDia((e.target.value === '20' ? 20 : 15) as 15 | 20)}
                  className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60 focus:bg-slate-800/50"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '12px'
                  }}
                >
                  <option value={15} className="bg-slate-900 text-slate-100">Dia 15</option>
                  <option value={20} className="bg-slate-900 text-slate-100">Dia 20</option>
                </select>
              </div>
            </Field>
          ) : (
            <Field label="Jornada mensal (horas)">
              <Input name="jornadaMensalHoras" type="text" inputMode="decimal" step="1" defaultValue={defaults.jornadaMensalHoras} />
            </Field>
          )}
        </div>

        {contractType === 'clt' && (
          <Field label="Jornada mensal (horas)">
            <Input name="jornadaMensalHoras" type="text" inputMode="decimal" step="1" defaultValue={defaults.jornadaMensalHoras} />
          </Field>
        )}

        <Field label="Mês/Ano da simulação">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                name="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60 focus:bg-slate-800/50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '12px'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = String(i + 1).padStart(2, '0')
                  const monthName = new Date(2000, i, 1).toLocaleDateString('pt-BR', { month: 'long' })
                  return (
                    <option key={monthNum} value={monthNum} className="bg-slate-900 text-slate-100">
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="relative">
              <select
                name="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60 focus:bg-slate-800/50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '12px'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = defaultYear - 1 + i
                  return (
                    <option key={year} value={String(year)} className="bg-slate-900 text-slate-100">
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </Field>

        <Field label="Salário base">
          <Input name="salarioBase" type="text" inputMode="decimal" placeholder="Ex.: 3.500,00" required />
        </Field>

        {contractType === 'clt' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        ) : (
          <Field label="Bônus" hint="Valor fixo de bônus">
            <Input
              name="bonus"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Atrasos/Faltas (horas)">
            <Input name="atrasosHoras" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
          <Field label="Adicionais (%)" hint="ex: 30 = 30%">
            <Input name="adicionaisPercentual" type="text" inputMode="decimal" placeholder="0" defaultValue="0" />
          </Field>
        </div>

        {contractType === 'pj' ? (
          <Field label="Descontos estimados (%)" hint="padrão: 10%">
            <Input
              name="descontosPercentual"
              type="text"
              inputMode="decimal"
              defaultValue={String(defaults.descontosPercentual)}
            />
          </Field>
        ) : (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            <span className="font-semibold">✓ Descontos automáticos (CLT)</span>: INSS progressivo e IRRF progressivo (base: bruto − INSS)
          </div>
        )}

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

