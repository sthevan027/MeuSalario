import { clampNumber, money } from '@/lib/calculators/utils'
import type { MonthlySimulationInput, MonthlySimulationResult } from '@/lib/calculators/types'
import { calcularDescontosPJ, calcularINSS, calcularIRRF } from '@/lib/calculators/tax'

type ProgressiveSlice = { upTo: number; rate: number }
type IrBracket = { upTo: number; rate: number; deduction: number }

/**
 * Simula o cálculo de salário mensal (CLT ou PJ)
 * 
 * Precisão estimada: 80-90%
 * 
 * Limitações conhecidas:
 * - Não considera: pensão alimentícia judicial, desconto simplificado de IRRF
 * - Não considera: descontos específicos da empresa (vale-transporte, convênio, etc.)
 * - Não considera: convenções coletivas que possam alterar valores
 * - Dependentes: reduz base do IRRF em R$ 189,59 por dependente (2026)
 * - Adiantamento: simplificado como 40% do salário base (pode variar)
 * 
 * @param input - Dados da simulação mensal
 * @returns Resultado da simulação com breakdown detalhado
 */

/**
 * Calcula a data da Páscoa para um determinado ano (algoritmo de Gauss)
 */
function calcularPascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes, dia)
}

/**
 * Retorna lista de feriados nacionais do Brasil para um determinado ano
 */
function obterFeriadosNacionais(ano: number): Date[] {
  const feriados: Date[] = []
  
  // Feriados fixos
  feriados.push(new Date(ano, 0, 1)) // 1/1 - Ano Novo
  feriados.push(new Date(ano, 3, 21)) // 21/4 - Tiradentes
  feriados.push(new Date(ano, 4, 1)) // 1/5 - Dia do Trabalho
  feriados.push(new Date(ano, 8, 7)) // 7/9 - Independência
  feriados.push(new Date(ano, 9, 12)) // 12/10 - Nossa Senhora Aparecida
  feriados.push(new Date(ano, 10, 2)) // 2/11 - Finados
  feriados.push(new Date(ano, 10, 15)) // 15/11 - Proclamação da República
  feriados.push(new Date(ano, 11, 25)) // 25/12 - Natal
  
  // Feriados móveis (baseados na Páscoa)
  const pascoa = calcularPascoa(ano)
  
  // Carnaval (47 dias antes da Páscoa - terça-feira)
  const carnaval = new Date(pascoa)
  carnaval.setDate(pascoa.getDate() - 47)
  feriados.push(carnaval)
  
  // Sexta-feira Santa (2 dias antes da Páscoa)
  const sextaFeiraSanta = new Date(pascoa)
  sextaFeiraSanta.setDate(pascoa.getDate() - 2)
  feriados.push(sextaFeiraSanta)
  
  // Corpus Christi (60 dias após a Páscoa - quinta-feira)
  const corpusChristi = new Date(pascoa)
  corpusChristi.setDate(pascoa.getDate() + 60)
  feriados.push(corpusChristi)
  
  return feriados
}

/**
 * Calcula quantos domingos e feriados tem em um mês específico
 */
function calcularDomingosEFeriados(ano: number, mes: number): { domingos: number; feriados: number; diasUteis: number } {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const totalDias = ultimoDia.getDate()
  
  // Contar domingos
  let domingos = 0
  for (let dia = 1; dia <= totalDias; dia++) {
    const data = new Date(ano, mes, dia)
    if (data.getDay() === 0) domingos++
  }
  
  // Obter feriados nacionais e contar quantos caem neste mês
  const feriadosNacionais = obterFeriadosNacionais(ano)
  let feriados = 0
  const feriadosSet = new Set<string>()
  
  for (const feriado of feriadosNacionais) {
    if (feriado.getFullYear() === ano && feriado.getMonth() === mes) {
      const key = `${feriado.getDate()}-${feriado.getMonth()}`
      if (!feriadosSet.has(key)) {
        feriadosSet.add(key)
        // Não contar domingo como feriado (já contado)
        if (feriado.getDay() !== 0) {
          feriados++
        }
      }
    }
  }
  
  const diasUteis = totalDias - domingos - feriados
  
  return { domingos, feriados, diasUteis }
}

/**
 * Calcula o DSR (Descanso Semanal Remunerado) sobre horas extras
 * Fórmula: DSR = (valor das horas extras / dias úteis) × (domingos + feriados)
 * Calcula automaticamente domingos e feriados do mês atual
 */
function calcDSR(valorHorasExtras: number, month?: number, year?: number): number {
  if (valorHorasExtras <= 0) return 0
  
  const hoje = new Date()
  const ano = year ?? hoje.getFullYear()
  const mes = month ? month - 1 : hoje.getMonth() // month vem como 1-12, getMonth retorna 0-11
  
  const { domingos, feriados, diasUteis } = calcularDomingosEFeriados(ano, mes)
  
  if (diasUteis <= 0) return 0
  
  const domingosEFeriados = domingos + feriados
  const dsr = (valorHorasExtras / diasUteis) * domingosEFeriados
  
  return money(dsr)
}

export function simulateMonthly(input: MonthlySimulationInput): MonthlySimulationResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const jornadaMensalHoras = clampNumber(input.jornadaMensalHoras, 1, 400)
  const horas50 = clampNumber(input.horas50, 0, 300)
  const horas100 = clampNumber(input.horas100, 0, 300)
  const horas150 = clampNumber(input.horas150, 0, 300)
  const bonus = clampNumber(input.bonus ?? 0, 0, 1_000_000)
  const atrasosHoras = clampNumber(input.atrasosHoras, 0, 300)
  const adicionaisPercentual = clampNumber(input.adicionaisPercentual, 0, 200)
  const descontosPercentual = clampNumber(input.descontosPercentual ?? 10, 0, 100)
  const adiantamentoDia: 15 | 20 = input.adiantamentoDia === 20 ? 20 : 15

  const valorHora = salarioBase / jornadaMensalHoras

  // CLT: horas extras calculadas; PJ: bônus fixo
  const horasExtrasOuBonus =
    input.contractType === 'clt'
      ? money(valorHora * (horas50 * 1.5 + horas100 * 2 + horas150 * 2.5))
      : money(bonus)

  // DSR sobre horas extras (apenas para CLT)
  const dsr = input.contractType === 'clt' ? calcDSR(horasExtrasOuBonus, input.month, input.year) : 0

  // Adicionais: calculados sobre salário base + horas extras
  const baseAdicionais = input.contractType === 'clt' 
    ? salarioBase + horasExtrasOuBonus
    : salarioBase
  const adicionais = money((baseAdicionais * adicionaisPercentual) / 100)

  const atrasos = money(valorHora * atrasosHoras)

  const bruto = money(salarioBase + horasExtrasOuBonus + dsr + adicionais)
  const baseCalculo = money(bruto - atrasos)
  
  // Cálculo de descontos: CLT vs PJ
  let inss = 0
  let irrf = 0
  let descontos = 0
  let das: number | undefined
  let inssProLabore: number | undefined
  let irrfProLabore: number | undefined

  if (input.contractType === 'clt') {
    // CLT: INSS e IRRF automáticos usando tabelas reais de 2026
    const dependentes = clampNumber(input.dependentes ?? 0, 0, 20)
    inss = calcularINSS(baseCalculo)
    irrf = calcularIRRF(baseCalculo, inss, dependentes)
    descontos = money(inss + irrf)
  } else {
    // PJ: cálculo real ou percentual genérico
    const usaCalculoReal = input.proLabore !== undefined && input.anexoSimplesNacional !== undefined

    if (usaCalculoReal) {
      // Cálculo real de impostos PJ
      const proLabore = input.proLabore ?? money(baseCalculo * 0.3) // Se não informado, estima 30% do faturamento
      const anexo = input.anexoSimplesNacional ?? 'III'
      
      const descontosPJ = calcularDescontosPJ(
        baseCalculo,
        proLabore,
        anexo,
        input.faturamentoAnualAcumulado
      )

      das = descontosPJ.das
      inssProLabore = descontosPJ.inssProLabore
      irrfProLabore = descontosPJ.irrfProLabore
      descontos = descontosPJ.total
      
      // Para compatibilidade, mantém inss e irrf como 0 para PJ
      inss = 0
      irrf = 0
    } else {
      // Sem cálculo real: não calcula descontos (usuário deve informar pró-labore)
      descontos = 0
      inss = 0
      irrf = 0
    }
  }

  const liquido = money(baseCalculo - descontos)

  // CLT: pagamento em 2 partes (adiantamento + pagamento final)
  // PJ: pagamento único (sem adiantamento)
  const adiantamentoPercentual = input.contractType === 'clt' ? 40 : 0
  const adiantamento = input.contractType === 'clt' ? money(salarioBase * (adiantamentoPercentual / 100)) : 0
  const saldoPagamento = input.contractType === 'clt' ? money(Math.max(0, liquido - adiantamento)) : liquido

  const items = [
    { key: 'base', label: input.contractType === 'pj' ? 'Faturamento bruto (valor recebido da empresa)' : 'Salário base', amount: money(salarioBase), kind: 'earning' as const },
    {
      key: input.contractType === 'clt' ? 'extras' : 'bonus',
      label: input.contractType === 'clt' ? 'Horas extras' : 'Bônus',
      amount: horasExtrasOuBonus,
      kind: 'earning' as const,
    },
    ...(input.contractType === 'clt' && dsr > 0
      ? ([{ key: 'dsr', label: 'DSR sobre horas extras', amount: dsr, kind: 'earning' as const }] as const)
      : []),
    { key: 'add', label: 'Adicionais (%)', amount: adicionais, kind: 'earning' as const },
    { key: 'late', label: 'Atrasos/Faltas', amount: atrasos, kind: 'deduction' as const },
    ...(input.contractType === 'clt'
      ? ([
          { key: 'inss', label: 'INSS (tabela 2026)', amount: inss, kind: 'deduction' as const },
          {
            key: 'irrf',
            label: input.dependentes && input.dependentes > 0 ? `IRRF (tabela 2026) - ${input.dependentes} dependente(s)` : 'IRRF (tabela 2026)',
            amount: irrf,
            kind: 'deduction' as const,
          },
        ] as const)
      : // PJ: mostra descontos reais com pró-labore destacado
        input.proLabore !== undefined && input.anexoSimplesNacional !== undefined
        ? (() => {
            const proLabore = input.proLabore ?? 0
            const proLaboreLiquido = proLabore - (inssProLabore ?? 0) - (irrfProLabore ?? 0)
            return [
              { key: 'prolabore-info', label: `ℹ️ Pró-labore: R$ ${proLabore.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (valor que você recebe da sua empresa)`, amount: 0, kind: 'info' as const },
              { key: 'das', label: 'DAS (Simples Nacional) - sobre faturamento total', amount: das ?? 0, kind: 'deduction' as const },
              { key: 'inss-prolabore', label: 'INSS sobre pró-labore (11%)', amount: inssProLabore ?? 0, kind: 'deduction' as const },
              { key: 'irrf-prolabore', label: 'IRRF sobre pró-labore', amount: irrfProLabore ?? 0, kind: 'deduction' as const },
              { key: 'prolabore-liquido', label: `Pró-labore líquido (recebido): R$ ${proLaboreLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amount: proLaboreLiquido, kind: 'info' as const },
            ] as const
          })()
        : []), // Sem cálculo real: não mostra descontos genéricos
    // Adiantamento só para CLT
    ...(input.contractType === 'clt'
      ? ([
          {
            key: 'adv',
            label: `Adiantamento (dia ${adiantamentoDia}) — ${adiantamentoPercentual}% do salário base`,
            amount: adiantamento,
            kind: 'deduction' as const,
          },
        ] as const)
      : []),
    {
      key: 'pay',
      label: input.contractType === 'clt' ? 'Pagamento final (fim do mês)' : 'Pagamento único',
      amount: saldoPagamento,
      kind: 'info' as const,
    },
  ]

  return {
    bruto,
    adicionais,
    horasExtras: horasExtrasOuBonus, // Mantém compatibilidade, mas para PJ é bônus
    atrasos,
    inss,
    irrf,
    descontos,
    liquido,
    adiantamentoPercentual,
    adiantamentoDia: input.contractType === 'clt' ? adiantamentoDia : undefined,
    adiantamento,
    saldoPagamento,
    items,
    // Campos adicionais para PJ
    das: input.contractType === 'pj' ? das : undefined,
    inssProLabore: input.contractType === 'pj' ? inssProLabore : undefined,
    irrfProLabore: input.contractType === 'pj' ? irrfProLabore : undefined,
  }
}

