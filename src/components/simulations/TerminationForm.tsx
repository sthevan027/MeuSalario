'use client'

import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { createTermination } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResultBreakdown } from '@/components/simulations/ResultBreakdown'
import { simulateTermination } from '@/lib/calculators/termination'
import { useMemo, useState, useEffect } from 'react'
import { getLastSalaryBase } from '@/lib/last-salary'

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
  const [diasTrabalhadosNoMes, setDiasTrabalhadosNoMes] = useState('15')
  const [tipoRescisao, setTipoRescisao] = useState<'sem_justa_causa' | 'acordo' | 'pedido_demissao' | 'justa_causa'>('sem_justa_causa')
  const [salarioBase, setSalarioBase] = useState('')

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
    return simulateTermination({
      salarioBase: parseFloat(salarioBase) || 3000,
      mesesTrabalhadosNoAno: 6,
      avisoPrevioDias: 30,
      feriasVencidas: false,
      saldoFgtsMesesEstimado: 12,
      diasTrabalhadosNoMes: parseInt(diasTrabalhadosNoMes) || 15,
      tipoRescisao,
    })
  }, [state, diasTrabalhadosNoMes, tipoRescisao, salarioBase])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Meses trabalhados no ano" hint="0 a 12">
            <Input name="mesesTrabalhadosNoAno" type="number" inputMode="decimal" step="1" defaultValue={6} />
          </Field>
          <Field label="Aviso prévio (dias)" hint="ex: 30">
            <Input name="avisoPrevioDias" type="number" inputMode="decimal" step="1" defaultValue={30} />
          </Field>
        </div>

        <Field label="Dias trabalhados no mês da rescisão" hint="Padrão: 15 dias">
          <Input
            name="diasTrabalhadosNoMes"
            type="number"
            inputMode="decimal"
            step="1"
            defaultValue={15}
            value={diasTrabalhadosNoMes}
            onChange={(e) => setDiasTrabalhadosNoMes(e.target.value)}
          />
        </Field>

        <Field label="Tipo de rescisão">
          <div className="relative">
            <select
              name="tipoRescisao"
              value={tipoRescisao}
              onChange={(e) => setTipoRescisao(e.target.value as any)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/60 focus:bg-slate-800/50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '12px'
              }}
            >
              <option value="sem_justa_causa" className="bg-slate-900 text-slate-100">
                Demissão sem justa causa (multa FGTS 40%)
              </option>
              <option value="acordo" className="bg-slate-900 text-slate-100">
                Acordo entre as partes (multa FGTS 20%)
              </option>
              <option value="pedido_demissao" className="bg-slate-900 text-slate-100">
                Pedido de demissão (sem multa FGTS)
              </option>
              <option value="justa_causa" className="bg-slate-900 text-slate-100">
                Demissão por justa causa (sem multa FGTS)
              </option>
            </select>
          </div>
        </Field>

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

      <div className="space-y-4">
        <ResultBreakdown title="Resultado da rescisão" totalLabel="Total líquido (estimativa)" total={preview.total} items={preview.items} />
        {preview.totalBruto && preview.totalDescontos && (
          <p className="text-[10px] text-slate-500">
            * Valores estimados. Podem variar conforme convenção coletiva e outros fatores.
          </p>
        )}
      </div>
    </div>
  )
}

