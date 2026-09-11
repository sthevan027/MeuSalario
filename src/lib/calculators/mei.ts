/**
 * Alerta de teto MEI — "quanto já faturei esse ano, e vou estourar o limite?"
 *
 * Depende de faturamento real lançado pelo usuário (manual ou importado de
 * extrato) — sem esse dado não tem como calcular acumulado de verdade.
 * Ver docs/planejamento-compatibilidade-salarial.md (mesmo espírito de
 * documentação) e a migração 20260911120000_pj_revenue_and_mei.sql.
 */
import { money } from './utils'

export type MeiStatus = 'tranquilo' | 'atencao' | 'alerta' | 'estourado'

export type MeiAlertInput = {
  /** Soma do faturamento já lançado no ano corrente (todas as competências do ano). */
  faturamentoAcumuladoAno: number
  /** Quantos meses do ano já têm lançamento (1-12) — usado pra projeção. */
  mesesComLancamento: number
  /** Limite anual do MEI (vem de tax_config, ver getTaxConfig()). */
  limiteAnual: number
  /** Mês atual do ano (1-12) — usado pra saber quantos meses ainda restam. */
  mesAtual: number
}

export type MeiAlertResult = {
  faturamentoAcumuladoAno: number
  limiteAnual: number
  percentualUtilizado: number
  restanteAnual: number
  status: MeiStatus
  /** Projeção linear: média mensal do que já foi lançado × 12. */
  projecaoAnual: number
  vaiEstourarNoRitmoAtual: boolean
  /** Quanto ainda dá pra faturar por mês, nos meses restantes, sem estourar. */
  limiteSugeridoPorMesRestante: number | null
  mesesRestantes: number
  insights: string[]
}

function classificarStatus(percentual: number): MeiStatus {
  if (percentual >= 1) return 'estourado'
  if (percentual >= 0.9) return 'alerta'
  if (percentual >= 0.75) return 'atencao'
  return 'tranquilo'
}

export function calcularAlertaMei(input: MeiAlertInput): MeiAlertResult {
  const limiteAnual = input.limiteAnual > 0 ? input.limiteAnual : 81_000
  const faturamentoAcumuladoAno = Math.max(0, money(input.faturamentoAcumuladoAno))
  const mesesComLancamento = Math.min(12, Math.max(0, Math.round(input.mesesComLancamento)))
  const mesAtual = Math.min(12, Math.max(1, Math.round(input.mesAtual)))

  const percentualUtilizado = money((faturamentoAcumuladoAno / limiteAnual) * 100) / 100
  const restanteAnual = money(Math.max(0, limiteAnual - faturamentoAcumuladoAno))
  const status = classificarStatus(percentualUtilizado)

  const mediaMensal = mesesComLancamento > 0 ? faturamentoAcumuladoAno / mesesComLancamento : 0
  const projecaoAnual = money(mediaMensal * 12)
  const vaiEstourarNoRitmoAtual = mesesComLancamento > 0 && projecaoAnual > limiteAnual

  const mesesRestantes = Math.max(0, 12 - mesAtual + 1) // inclui o mês atual
  const limiteSugeridoPorMesRestante =
    mesesRestantes > 0 ? money(Math.max(0, restanteAnual) / mesesRestantes) : null

  const insights: string[] = []
  if (status === 'estourado') {
    insights.push(
      `Você já ultrapassou o limite anual do MEI em ${money(faturamentoAcumuladoAno - limiteAnual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
    )
    insights.push('Vale conversar com um contador sobre desenquadramento ou regularização.')
  } else if (status === 'alerta') {
    insights.push(`Você já usou ${(percentualUtilizado * 100).toFixed(1)}% do limite anual do MEI.`)
    insights.push(
      `Restam ${restanteAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} até o teto.`
    )
  } else if (status === 'atencao') {
    insights.push(`Você atingiu ${(percentualUtilizado * 100).toFixed(1)}% do limite anual do MEI — fique de olho.`)
  } else {
    insights.push('Faturamento dentro do esperado para o limite anual do MEI.')
  }

  if (vaiEstourarNoRitmoAtual && status !== 'estourado') {
    insights.push(
      `No ritmo atual (média de ${mediaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês), a projeção anual é ${projecaoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — acima do limite.`
    )
  }

  if (limiteSugeridoPorMesRestante !== null && status !== 'estourado' && mesesRestantes > 0) {
    insights.push(
      `Pra não estourar, dá pra faturar até ${limiteSugeridoPorMesRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês nos ${mesesRestantes} mês(es) restantes.`
    )
  }

  return {
    faturamentoAcumuladoAno,
    limiteAnual,
    percentualUtilizado,
    restanteAnual,
    status,
    projecaoAnual,
    vaiEstourarNoRitmoAtual,
    limiteSugeridoPorMesRestante,
    mesesRestantes,
    insights,
  }
}
