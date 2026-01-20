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
  const [tipoRescisao, setTipoRescisao] = useState<'sem_justa_causa' | 'acordo' | 'pedido_demissao' | 'justa_causa'>('sem_justa_causa')
  const [salarioBase, setSalarioBase] = useState('')
  const [dataEntrada, setDataEntrada] = useState('')
  const [dataSaida, setDataSaida] = useState('')
  const [avisoPrevioDias, setAvisoPrevioDias] = useState('30')
  const [feriasVencidas, setFeriasVencidas] = useState(false)

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

  // Função auxiliar para calcular meses entre duas datas
  // Considera mês completo se tiver pelo menos 15 dias trabalhados
  const calcularMesesEntreDatas = (dataInicio: Date, dataFim: Date): number => {
    if (dataFim < dataInicio) return 0
    
    // Calcula diferença em anos e meses
    let anos = dataFim.getFullYear() - dataInicio.getFullYear()
    let meses = dataFim.getMonth() - dataInicio.getMonth()
    let dias = dataFim.getDate() - dataInicio.getDate()
    
    // Ajusta se os dias são negativos
    if (dias < 0) {
      meses--
      // Pega o último dia do mês anterior
      const ultimoDiaMesAnterior = new Date(dataFim.getFullYear(), dataFim.getMonth(), 0).getDate()
      dias += ultimoDiaMesAnterior
    }
    
    // Calcula meses totais
    let mesesTotais = anos * 12 + meses
    
    // Se trabalhou pelo menos 15 dias no mês parcial, conta como mês completo
    if (dias >= 15) {
      mesesTotais++
    }
    
    return Math.max(0, mesesTotais)
  }

  // Calcula períodos baseado nas datas
  const calculosPeriodos = useMemo(() => {
    if (!dataEntrada || !dataSaida) {
      return {
        mesesTrabalhadosNoAno: 0,
        mesesPeriodoAquisitivo: 0,
        saldoFgtsMesesEstimado: 0,
        diasTrabalhadosNoMes: 15,
      }
    }

    const entrada = new Date(dataEntrada + 'T00:00:00')
    const saida = new Date(dataSaida + 'T00:00:00')
    
    if (saida < entrada) {
      return {
        mesesTrabalhadosNoAno: 0,
        mesesPeriodoAquisitivo: 0,
        saldoFgtsMesesEstimado: 0,
        diasTrabalhadosNoMes: 15,
      }
    }

    // Tempo total na empresa (para FGTS) - em meses
    const mesesTotal = calcularMesesEntreDatas(entrada, saida)
    
    // Ano da data de saída (ano de referência para 13º)
    const anoSaida = saida.getFullYear()
    const inicioAnoSaida = new Date(anoSaida, 0, 1)
    const fimAnoSaida = new Date(anoSaida, 11, 31, 23, 59, 59)
    
    // Período trabalhado no ano da saída (para 13º proporcional)
    const dataInicioAno = entrada > inicioAnoSaida ? entrada : inicioAnoSaida
    const dataFimAno = saida < fimAnoSaida ? saida : fimAnoSaida
    const mesesTrabalhadosNoAno = calcularMesesEntreDatas(dataInicioAno, dataFimAno)
    
    // Meses desde último período de férias (período aquisitivo)
    // Este valor será usado para calcular férias proporcionais
    let mesesPeriodoAquisitivo = mesesTotal
    
    if (feriasVencidas) {
      // Se marcou férias vencidas, significa que já completou pelo menos 12 meses
      if (mesesTotal > 12) {
        // Tem férias vencidas + proporcionais dos meses além dos 12
        // Ex: 19 meses = 12 meses (férias vencidas) + 7 meses (proporcionais)
        const resto = mesesTotal % 12
        mesesPeriodoAquisitivo = resto === 0 ? 0 : resto // Se resto = 0, não tem proporcionais
      } else {
        // Tem entre 0 e 12 meses, mas marcou férias vencidas
        // Isso significa que completou 12 meses (férias vencidas), sem proporcionais
        mesesPeriodoAquisitivo = 0
      }
    } else {
      // Não marcou férias vencidas
      if (mesesTotal >= 12) {
        // Tem 12+ meses mas não marcou férias vencidas
        // Considera apenas proporcionais até 12 meses
        mesesPeriodoAquisitivo = 12
      } else {
        // Menos de 12 meses = férias proporcionais baseado no tempo total
        mesesPeriodoAquisitivo = mesesTotal
      }
    }
    
    // Dias trabalhados no mês da rescisão
    const diasTrabalhadosNoMes = saida.getDate()

    return {
      mesesTrabalhadosNoAno: Math.min(12, mesesTrabalhadosNoAno),
      mesesPeriodoAquisitivo: Math.min(12, mesesPeriodoAquisitivo),
      saldoFgtsMesesEstimado: mesesTotal,
      diasTrabalhadosNoMes: Math.min(31, Math.max(1, diasTrabalhadosNoMes)),
    }
  }, [dataEntrada, dataSaida, feriasVencidas])

  const preview = useMemo(() => {
    if (state && state.ok) return state.data.result
    
    const salarioBaseValue = parseFloat(salarioBase.replace(/\./g, '').replace(',', '.')) || 0
    const avisoPrevioValue = parseInt(avisoPrevioDias) || 0
    
    if (salarioBaseValue === 0 || !dataEntrada || !dataSaida) {
      return {
        total: 0,
        totalBruto: 0,
        totalDescontos: 0,
        items: []
      }
    }
    
    return simulateTermination({
      salarioBase: salarioBaseValue,
      mesesTrabalhadosNoAno: calculosPeriodos.mesesTrabalhadosNoAno,
      mesesPeriodoAquisitivo: calculosPeriodos.mesesPeriodoAquisitivo,
      avisoPrevioDias: avisoPrevioValue,
      feriasVencidas,
      saldoFgtsMesesEstimado: calculosPeriodos.saldoFgtsMesesEstimado,
      diasTrabalhadosNoMes: calculosPeriodos.diasTrabalhadosNoMes,
      tipoRescisao,
    })
  }, [state, tipoRescisao, salarioBase, dataEntrada, dataSaida, avisoPrevioDias, feriasVencidas, calculosPeriodos])

  // Formata data para input type="date" (YYYY-MM-DD)
  const hoje = new Date().toISOString().split('T')[0]
  const dataEntradaMax = dataSaida || hoje

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
          <Field label="Data de entrada" hint="Data em que começou a trabalhar na empresa">
            <Input 
              name="dataEntrada" 
              type="date" 
              value={dataEntrada}
              max={dataEntradaMax}
              onChange={(e) => setDataEntrada(e.target.value)}
              required 
            />
          </Field>
          <Field label="Data de saída" hint="Data prevista para sair da empresa">
            <Input 
              name="dataSaida" 
              type="date" 
              value={dataSaida}
              min={dataEntrada || undefined}
              onChange={(e) => setDataSaida(e.target.value)}
              required 
            />
          </Field>
        </div>

        <Field label="Aviso prévio (dias)" hint="ex: 30">
          <Input 
            name="avisoPrevioDias" 
            type="number" 
            inputMode="decimal" 
            step="1" 
            min="0"
            max="90"
            value={avisoPrevioDias}
            onChange={(e) => setAvisoPrevioDias(e.target.value)}
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
            checked={feriasVencidas}
            onChange={(e) => setFeriasVencidas(e.target.checked)}
          />
        </div>

        {/* Campos ocultos para enviar os valores calculados */}
        <input type="hidden" name="mesesTrabalhadosNoAno" value={calculosPeriodos.mesesTrabalhadosNoAno} />
        <input type="hidden" name="mesesPeriodoAquisitivo" value={calculosPeriodos.mesesPeriodoAquisitivo} />
        <input type="hidden" name="saldoFgtsMesesEstimado" value={calculosPeriodos.saldoFgtsMesesEstimado} />
        <input type="hidden" name="diasTrabalhadosNoMes" value={calculosPeriodos.diasTrabalhadosNoMes} />

        {/* Resumo dos cálculos automáticos */}
        {dataEntrada && dataSaida && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 text-xs font-semibold text-emerald-300">Valores calculados automaticamente:</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Tempo total:</span>{' '}
                <span className="font-semibold">{calculosPeriodos.saldoFgtsMesesEstimado} meses</span>
              </div>
              <div>
                <span className="text-slate-400">Meses no ano:</span>{' '}
                <span className="font-semibold">{calculosPeriodos.mesesTrabalhadosNoAno} meses</span>
              </div>
              <div>
                <span className="text-slate-400">Período aquisitivo:</span>{' '}
                <span className="font-semibold">{calculosPeriodos.mesesPeriodoAquisitivo} meses</span>
              </div>
              <div>
                <span className="text-slate-400">Dias no mês:</span>{' '}
                <span className="font-semibold">{calculosPeriodos.diasTrabalhadosNoMes} dias</span>
              </div>
            </div>
          </div>
        )}

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
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500">
              * Valores estimados. Podem variar conforme convenção coletiva e outros fatores.
            </p>
            <p className="text-[10px] text-slate-400">
              ** O saldo do FGTS depositado (R$ {preview.items.find((i: { key: string; amount: number }) => i.key === 'fgts_info')?.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) não está incluído neste total, pois é liberado separadamente pela Caixa Econômica Federal.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

