'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { reserveCompatibilityAnalysis } from '@/app/app/actions'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SimulationLimitModal } from '@/components/usage/SimulationLimitModal'
import { formatBRL } from '@/lib/format'
import { simulateSalaryFit } from '@/lib/calculators/compatibility'
import {
  EMPTY_LIFE_COST,
  type LifeCostInput,
  type BenefitItem,
  type SalaryFitResult,
} from '@/lib/calculators/compatibility-types'
import type { ContractType } from '@/lib/calculators/types'
import { ChevronRight, ChevronLeft, Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

const STATUS_LABELS: Record<SalaryFitResult['compatibilityStatus'], string> = {
  confortavel: 'Confortável',
  viavel: 'Viável',
  apertado: 'Apertado',
  inviavel: 'Inviável',
}

const STATUS_COLORS: Record<SalaryFitResult['compatibilityStatus'], string> = {
  confortavel: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  viavel: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  apertado: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  inviavel: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

function parseMoney(s: string): number {
  if (!s?.trim()) return 0
  // Formato BR: 1.234,56 -> remove pontos, troca vírgula por ponto
  const cleaned = s.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

function formatMoneyInput(n: number): string {
  if (n === 0) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type QuotaProps = {
  isPro: boolean
  compatibilityRemaining: number
}

export function CompatibilityForm({ quota }: { quota: QuotaProps }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [goingToResult, setGoingToResult] = useState(false)
  const [compatReserveError, setCompatReserveError] = useState<string | null>(null)
  const [compatLeft, setCompatLeft] = useState(quota.compatibilityRemaining)

  useEffect(() => {
    setCompatLeft(quota.compatibilityRemaining)
  }, [quota.compatibilityRemaining])

  useEffect(() => {
    if (step !== 3) setCompatReserveError(null)
  }, [step])

  async function goToResultStep() {
    if (quota.isPro) {
      setStep(4)
      return
    }
    if (compatLeft <= 0) {
      setLimitModalOpen(true)
      return
    }
    setGoingToResult(true)
    setCompatReserveError(null)
    try {
      const res = await reserveCompatibilityAnalysis()
      if (!res.ok) {
        if ('code' in res && res.code === 'QUOTA_EXCEEDED') setLimitModalOpen(true)
        else setCompatReserveError(res.message)
        return
      }
      if (res.data?.compatibilityRemaining != null) {
        setCompatLeft(res.data.compatibilityRemaining)
      }
      setStep(4)
      router.refresh()
    } finally {
      setGoingToResult(false)
    }
  }

  const blockedCompat = !quota.isPro && compatLeft <= 0
  const [contractType, setContractType] = useState<ContractType>('clt')
  const [grossCompensation, setGrossCompensation] = useState('6000')
  const [dependentes, setDependentes] = useState('0')
  const [proLabore, setProLabore] = useState('')
  const [anexo, setAnexo] = useState<'III' | 'V'>('III')

  // Benefícios
  const [hasVrVa, setHasVrVa] = useState(false)
  const [vrVaValor, setVrVaValor] = useState('')
  const [vrVaDesconto, setVrVaDesconto] = useState('')
  const [hasVt, setHasVt] = useState(false)
  const [vtValor, setVtValor] = useState('')
  const [hasPlanoSaude, setHasPlanoSaude] = useState(false)
  const [planoSaudeValor, setPlanoSaudeValor] = useState('')
  const [hasBonus, setHasBonus] = useState(false)
  const [bonusValor, setBonusValor] = useState('')

  // Custos
  const [lifeCost, setLifeCost] = useState<LifeCostInput>({
    ...EMPTY_LIFE_COST,
    moradia: 1500,
    contasFixas: 300,
    alimentacao: 600,
    transporte: 300,
    saude: 150,
    reservaDesejada: 500,
  })

  const benefits: BenefitItem[] = useMemo(() => {
    const items: BenefitItem[] = []
    if (hasVrVa && parseMoney(vrVaValor) > 0) {
      const val = parseMoney(vrVaValor)
      const desc = parseMoney(vrVaDesconto)
      items.push({
        id: 'vr',
        type: 'vr',
        label: 'Vale Refeição/Alimentação',
        monthlyValue: val,
        employeeDiscount: desc,
        netValue: val - desc,
        includeInComparison: true,
      })
    }
    if (hasVt && parseMoney(vtValor) > 0) {
      items.push({
        id: 'vt',
        type: 'vt',
        label: 'Vale Transporte',
        monthlyValue: parseMoney(vtValor),
        netValue: parseMoney(vtValor),
        includeInComparison: true,
      })
    }
    if (hasPlanoSaude && parseMoney(planoSaudeValor) > 0) {
      items.push({
        id: 'ps',
        type: 'plano_saude',
        label: 'Plano de Saúde',
        monthlyValue: parseMoney(planoSaudeValor),
        netValue: parseMoney(planoSaudeValor),
        includeInComparison: true,
      })
    }
    if (hasBonus && parseMoney(bonusValor) > 0) {
      items.push({
        id: 'bonus',
        type: 'bonus',
        label: 'Bônus mensal',
        monthlyValue: parseMoney(bonusValor),
        netValue: parseMoney(bonusValor),
        includeInComparison: true,
      })
    }
    return items
  }, [
    hasVrVa,
    vrVaValor,
    vrVaDesconto,
    hasVt,
    vtValor,
    hasPlanoSaude,
    planoSaudeValor,
    hasBonus,
    bonusValor,
  ])

  const result = useMemo(() => {
    const gross = parseMoney(grossCompensation) || 6000
    const input = {
      contractType,
      grossCompensation: gross,
      dependentes: contractType === 'clt' ? parseInt(dependentes, 10) || 0 : undefined,
      proLabore: contractType === 'pj' && proLabore ? parseMoney(proLabore) : undefined,
      anexoSimplesNacional: contractType === 'pj' ? anexo : undefined,
      benefits,
      lifeCost,
    }
    return simulateSalaryFit(input)
  }, [contractType, grossCompensation, dependentes, proLabore, anexo, benefits, lifeCost])

  const updateLifeCost = (key: keyof LifeCostInput, value: number) => {
    setLifeCost((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <SimulationLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        onBuyPack={() => {
          setLimitModalOpen(false)
          window.location.href = '/app/conta'
        }}
        onUpgrade={() => {
          setLimitModalOpen(false)
          window.location.href = '/planos'
        }}
        title="Limite de análises de compatibilidade no plano FREE"
        description="Cada vez que você vê o resultado completo, conta uma análise. Faça upgrade para o Pro (ilimitado) ou use créditos quando disponíveis."
      />

      {!quota.isPro && step < 4 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          Plano FREE: você tem <strong className="text-white">{compatLeft}</strong> análise
          {compatLeft === 1 ? '' : 's'} de compatibilidade para ver o resultado completo.
        </div>
      ) : null}

      {/* Steps — só volta para etapas anteriores (evita pular para o resultado sem consumir cota) */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              if (s < step) setStep(s)
            }}
            disabled={s >= step}
            className={`h-2 flex-1 rounded-full transition-colors disabled:cursor-default ${
              step === s ? 'bg-emerald-500' : s < step ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10'
            }`}
            aria-label={`Etapa ${s}${s >= step ? ' (use Próximo para avançar)' : ''}`}
          />
        ))}
      </div>

      {/* Step 1: Dados da vaga */}
      {step === 1 && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Dados da proposta</h2>
          <Field label="Tipo de contrato">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContractType('clt')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  contractType === 'clt'
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                CLT
              </button>
              <button
                type="button"
                onClick={() => setContractType('pj')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  contractType === 'pj'
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                PJ
              </button>
            </div>
          </Field>
          <Field label="Valor da proposta (bruto mensal)" required>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="6.000,00"
              value={grossCompensation}
              onChange={(e) => setGrossCompensation(e.target.value)}
            />
          </Field>
          {contractType === 'clt' && (
            <Field label="Dependentes" hint="Reduz base do IRRF">
              <Input
                type="number"
                min={0}
                max={20}
                value={dependentes}
                onChange={(e) => setDependentes(e.target.value)}
              />
            </Field>
          )}
          {contractType === 'pj' && (
            <>
              <Field label="Pró-labore" hint="Valor que você retira da empresa">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex.: 4.200,00"
                  value={proLabore}
                  onChange={(e) => setProLabore(e.target.value)}
                />
              </Field>
              <Field label="Anexo Simples Nacional">
                <select
                  value={anexo}
                  onChange={(e) => setAnexo(e.target.value as 'III' | 'V')}
                  className="w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3 text-white"
                >
                  <option value="III">Anexo III - Serviços</option>
                  <option value="V">Anexo V - Serviços profissionais</option>
                </select>
              </Field>
            </>
          )}
        </div>
      )}

      {/* Step 2: Benefícios */}
      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Benefícios (opcional)</h2>
          <p className="text-sm text-slate-400">
            Benefícios reduzem seu custo real de vida. Informe os que se aplicam.
          </p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasVrVa}
              onChange={(e) => setHasVrVa(e.target.checked)}
              className="rounded border-white/20 bg-slate-900 text-emerald-500"
            />
            <span className="text-sm">Vale Refeição / Alimentação</span>
          </label>
          {hasVrVa && (
            <div className="grid gap-2 pl-6 sm:grid-cols-2">
              <Field label="Valor mensal">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="600,00"
                  value={vrVaValor}
                  onChange={(e) => setVrVaValor(e.target.value)}
                />
              </Field>
              <Field label="Desconto em folha">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={vrVaDesconto}
                  onChange={(e) => setVrVaDesconto(e.target.value)}
                />
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasVt}
              onChange={(e) => setHasVt(e.target.checked)}
              className="rounded border-white/20 bg-slate-900 text-emerald-500"
            />
            <span className="text-sm">Vale Transporte</span>
          </label>
          {hasVt && (
            <div className="pl-6">
              <Field label="Valor mensal">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="200,00"
                value={vtValor}
                onChange={(e) => setVtValor(e.target.value)}
              />
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasPlanoSaude}
              onChange={(e) => setHasPlanoSaude(e.target.checked)}
              className="rounded border-white/20 bg-slate-900 text-emerald-500"
            />
            <span className="text-sm">Plano de Saúde (empresa paga)</span>
          </label>
          {hasPlanoSaude && (
            <div className="pl-6">
              <Field label="Valor mensal estimado">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="400,00"
                value={planoSaudeValor}
                onChange={(e) => setPlanoSaudeValor(e.target.value)}
              />
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasBonus}
              onChange={(e) => setHasBonus(e.target.checked)}
              className="rounded border-white/20 bg-slate-900 text-emerald-500"
            />
            <span className="text-sm">Bônus mensal recorrente</span>
          </label>
          {hasBonus && (
            <div className="pl-6">
              <Field label="Valor mensal">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="500,00"
                value={bonusValor}
                onChange={(e) => setBonusValor(e.target.value)}
              />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Custos de vida */}
      {step === 3 && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Seus custos mensais</h2>
          <p className="text-sm text-slate-400">
            Informe seus gastos mensais reais para comparar com a proposta.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Moradia (aluguel/financiamento)">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.moradia)}
                onChange={(e) => updateLifeCost('moradia', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Contas fixas (luz, água, internet)">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.contasFixas)}
                onChange={(e) => updateLifeCost('contasFixas', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Alimentação (fora do ticket)">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.alimentacao)}
                onChange={(e) => updateLifeCost('alimentacao', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Transporte">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.transporte)}
                onChange={(e) => updateLifeCost('transporte', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Saúde / remédios">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.saude)}
                onChange={(e) => updateLifeCost('saude', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Educação">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.educacao)}
                onChange={(e) => updateLifeCost('educacao', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Dívidas / empréstimos">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.dividas)}
                onChange={(e) => updateLifeCost('dividas', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Dependentes / pensão">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.dependentes)}
                onChange={(e) => updateLifeCost('dependentes', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Lazer">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.lazer)}
                onChange={(e) => updateLifeCost('lazer', parseMoney(e.target.value))}
              />
            </Field>
            <Field label="Reserva desejada (economia mensal)">
              <Input
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(lifeCost.reservaDesejada)}
                onChange={(e) => updateLifeCost('reservaDesejada', parseMoney(e.target.value))}
              />
            </Field>
          </div>
          {compatReserveError ? (
            <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {compatReserveError}
            </div>
          ) : null}
        </div>
      )}

      {/* Step 4: Resultado */}
      {step === 4 && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-6 ${
              STATUS_COLORS[result.compatibilityStatus]
            }`}
          >
            <div className="flex items-center gap-2">
              {result.compatibilityStatus === 'inviavel' ? (
                <AlertCircle size={24} />
              ) : result.compatibilityBalance >= 0 ? (
                <TrendingUp size={24} />
              ) : (
                <TrendingDown size={24} />
              )}
              <h2 className="text-xl font-bold">
                {STATUS_LABELS[result.compatibilityStatus]}
              </h2>
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums">
              {formatBRL(result.compatibilityBalance)}/mês
            </p>
            <p className="mt-1 text-sm opacity-90">
              {result.compatibilityBalance >= 0 ? 'Sobra após custos e reserva' : 'Falta para fechar as contas'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Wallet size={16} /> O que entra
              </h3>
              <p className="text-lg font-semibold text-emerald-400">
                {formatBRL(result.netIncome)}
              </p>
              <p className="text-xs text-slate-500">Líquido estimado</p>
              {result.benefitsNetValue > 0 && (
                <p className="mt-2 text-sm text-slate-300">
                  + {formatBRL(result.benefitsNetValue)} benefícios
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">O que sai</h3>
              <p className="text-lg font-semibold text-slate-200">
                {formatBRL(result.monthlyLifeCost)}
              </p>
              <p className="text-xs text-slate-500">Custo de vida total</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Diagnóstico</h3>
            <ul className="space-y-2">
              {result.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="mt-1 text-emerald-400">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="flex justify-between gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft size={18} />
          Voltar
        </Button>
        {step < 4 ? (
          <Button
            type="button"
            onClick={() => {
              if (step === 3) {
                void goToResultStep()
              } else {
                setStep((s) => s + 1)
              }
            }}
            disabled={step === 3 && (goingToResult || blockedCompat)}
            className="gap-2"
          >
            {step === 3 && goingToResult ? 'Abrindo resultado...' : 'Próximo'}
            <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep(1)}
          >
            Nova simulação
          </Button>
        )}
      </div>
    </div>
  )
}
