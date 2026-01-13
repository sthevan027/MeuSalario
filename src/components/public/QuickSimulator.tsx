'use client'

import { useMemo, useState } from 'react'
import { simulateMonthly } from '@/lib/calculators/monthly'
import { formatBRL } from '@/lib/format'
import { toNumberOr } from '@/lib/number'

export function QuickSimulator() {
  const [contractType, setContractType] = useState<'clt' | 'pj'>('clt')
  const [salarioBase, setSalarioBase] = useState('3500')
  const [jornadaMensalHoras, setJornadaMensalHoras] = useState('220')
  const [descontosPercentual, setDescontosPercentual] = useState('20')
  const [adiantamentoDia, setAdiantamentoDia] = useState<15 | 20>(15)

  const result = useMemo(() => {
    const salarioBaseN = toNumberOr(salarioBase, 3500)
    const jornadaMensalHorasN = toNumberOr(jornadaMensalHoras, 220)
    const descontosPercentualN = toNumberOr(descontosPercentual, contractType === 'clt' ? 20 : 10)

    return simulateMonthly({
      contractType,
      salarioBase: salarioBaseN,
      jornadaMensalHoras: jornadaMensalHorasN,
      horas50: 0,
      horas100: 0,
      horas150: 0,
      atrasosHoras: 0,
      adicionaisPercentual: 0,
      descontosPercentual: descontosPercentualN,
      adiantamentoDia,
    })
  }, [contractType, salarioBase, jornadaMensalHoras, descontosPercentual, adiantamentoDia])

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold text-white">Simulador rápido</h3>
        <p className="text-sm text-slate-400">Uma estimativa em segundos (sem login).</p>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Contrato</label>
          <div className="relative">
            <select
              value={contractType}
              onChange={(e) => {
                const v = e.target.value as 'clt' | 'pj'
                setContractType(v)
                setDescontosPercentual(String(v === 'clt' ? 20 : 10))
              }}
              className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2.5 pr-10 text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="clt" className="bg-slate-950 text-slate-100">CLT</option>
              <option value="pj" className="bg-slate-950 text-slate-100">PJ</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Salário base</label>
            <input
              type="text"
              inputMode="decimal"
              value={salarioBase}
              onChange={(e) => setSalarioBase(e.target.value)}
              placeholder="Ex.: 3.500,00"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Jornada (horas)</label>
            <input
              type="text"
              inputMode="decimal"
              value={jornadaMensalHoras}
              onChange={(e) => setJornadaMensalHoras(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Adiantamento (dia)</label>
            <div className="relative">
              <select
                value={adiantamentoDia}
                onChange={(e) => setAdiantamentoDia((e.target.value === '20' ? 20 : 15) as 15 | 20)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2.5 pr-10 text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={15} className="bg-slate-950 text-slate-100">15</option>
                <option value={20} className="bg-slate-950 text-slate-100">20</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Descontos (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={descontosPercentual}
              onChange={(e) => setDescontosPercentual(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6">
        <div className="mb-2 text-sm font-medium text-slate-300">Líquido estimado</div>
        <div className="mb-6 text-4xl font-bold tabular-nums text-emerald-300">{formatBRL(result.liquido)}</div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center">
            <div className="mb-1 text-xs text-slate-400">Bruto</div>
            <div className="text-sm font-semibold tabular-nums text-white">{formatBRL(result.bruto)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center">
            <div className="mb-1 text-xs text-slate-400">Adiantamento (dia {adiantamentoDia})</div>
            <div className="text-sm font-semibold tabular-nums text-emerald-300">{formatBRL(result.adiantamento)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center">
            <div className="mb-1 text-xs text-slate-400">Pagamento final</div>
            <div className="text-sm font-semibold tabular-nums text-white">{formatBRL(result.saldoPagamento)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
