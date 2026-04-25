import { clampNumber, money } from '@/lib/calculators/utils'
import type { TerminationInput, TerminationResult } from '@/lib/calculators/types'
import { calcularINSS, calcularIRRF } from '@/lib/calculators/tax'

/**
 * Simula o cálculo de rescisão trabalhista CLT
 * 
 * Precisão estimada: 80-90%
 * 
 * Limitações conhecidas:
 * - Férias proporcionais: usa meses trabalhados no ano, não considera período aquisitivo completo
 * - FGTS: estimativa baseada em meses informados (não considera salário variável ao longo do tempo)
 * - Não considera: dependentes, pensão alimentícia, descontos específicos da empresa
 * - Não considera: convenções coletivas que possam alterar valores
 * - Fração de mês para 13º: simplificado (15+ dias = mês inteiro)
 * 
 * @param input - Dados da rescisão
 * @returns Resultado da simulação com total líquido e breakdown
 */
export function simulateTermination(input: TerminationInput): TerminationResult {
  const salarioBase = clampNumber(input.salarioBase, 0, 1_000_000)
  const mesesTrabalhadosNoAno = clampNumber(input.mesesTrabalhadosNoAno, 0, 12)
  // Meses do período aquisitivo (desde último período de férias). Se não informado, usa meses do ano atual
  const mesesPeriodoAquisitivo = input.mesesPeriodoAquisitivo !== undefined 
    ? clampNumber(input.mesesPeriodoAquisitivo, 0, 600)
    : mesesTrabalhadosNoAno
  const avisoPrevioDias = clampNumber(input.avisoPrevioDias, 0, 90)
  const feriasVencidas = !!input.feriasVencidas
  const saldoFgtsMesesEstimado = clampNumber(input.saldoFgtsMesesEstimado, 0, 600)
  const diasTrabalhadosNoMes = clampNumber(input.diasTrabalhadosNoMes ?? 15, 0, 31)
  const tipoRescisao = input.tipoRescisao ?? 'sem_justa_causa'

  // 1. Saldo de salário (dias trabalhados no mês da rescisão)
  const saldoSalario = money((salarioBase / 30) * diasTrabalhadosNoMes)

  // 2. Aviso prévio (indenizado)
  const avisoPrevio = money((salarioBase / 30) * avisoPrevioDias)

  // 3. Férias vencidas + 1/3 constitucional
  // Férias vencidas: quando completou 12 meses ou mais desde último período de férias
  // Se tiver férias vencidas marcado, tem direito a férias vencidas
  // Se não marcou mas período aquisitivo >= 12, também tem direito
  const temFeriasVencidas = feriasVencidas || mesesPeriodoAquisitivo >= 12
  const feriasVencidasValor = temFeriasVencidas ? money(salarioBase * (1 + 1 / 3)) : 0

  // 4. Férias proporcionais + 1/3 constitucional
  // Calcula proporcionais dos meses além dos 12 meses completos
  // Ex: 19 meses trabalhados com férias vencidas = 12 meses (vencidas) + 7 meses (proporcionais)
  let feriasProporcionais = 0
  // Se tem férias vencidas marcado E período aquisitivo > 0 e < 12, calcula proporcionais
  // OU se não tem férias vencidas mas período aquisitivo > 0 e < 12, calcula apenas proporcionais
  if (mesesPeriodoAquisitivo > 0 && mesesPeriodoAquisitivo < 12) {
    // Calcula proporcionais: (salário / 12) * meses * (1 + 1/3)
    feriasProporcionais = money((salarioBase * (mesesPeriodoAquisitivo / 12)) * (1 + 1 / 3))
  }

  // 5. 13º salário proporcional
  // Fração de mês: 15+ dias = mês inteiro (simplificado)
  const decimoTerceiroProporcional = money(salarioBase * (mesesTrabalhadosNoAno / 12))

  // 6. FGTS estimado: 8% por mês do salário base
  const saldoFgtsEstimado = money(salarioBase * 0.08 * saldoFgtsMesesEstimado)

  // 7. Multa FGTS (varia conforme tipo de rescisão)
  let multaFgts = 0
  let multaFgtsPercentual = 0
  if (tipoRescisao === 'sem_justa_causa') {
    multaFgtsPercentual = 0.4 // 40%
    multaFgts = money(saldoFgtsEstimado * multaFgtsPercentual)
  } else if (tipoRescisao === 'acordo') {
    multaFgtsPercentual = 0.2 // 20%
    multaFgts = money(saldoFgtsEstimado * multaFgtsPercentual)
  }
  // Pedido de demissão e justa causa: sem multa

  // 8. Cálculo de descontos (INSS e IRRF) sobre verbas rescisórias
  //
  // Bases diferentes por lei:
  // INSS: aviso prévio indenizado e férias indenizadas NÃO são salário de contribuição
  //   (Art. 28 §9°d e §9°e da Lei 8.212/91)
  // IRRF: férias indenizadas são isentas (Art. 6° V da Lei 7.713/88);
  //   aviso prévio indenizado é incluído (posição conservadora da RFB)
  const baseINSS = money(saldoSalario + decimoTerceiroProporcional)
  const baseIRRF = money(saldoSalario + avisoPrevio + decimoTerceiroProporcional)

  const inssRescisao = calcularINSS(baseINSS)
  const irrfRescisao = calcularIRRF(baseIRRF, inssRescisao)
  const totalDescontos = money(inssRescisao + irrfRescisao)

  // Total bruto (antes dos descontos)
  const totalBruto = money(
    saldoSalario +
      avisoPrevio +
      feriasVencidasValor +
      feriasProporcionais +
      decimoTerceiroProporcional +
      multaFgts
  )

  // Total líquido (após descontos)
  const totalLiquido = money(totalBruto - totalDescontos)

  const items = [
    { key: 'saldo_salario', label: 'Saldo de salário', amount: saldoSalario, kind: 'earning' as const },
    { key: 'aviso', label: 'Aviso prévio indenizado', amount: avisoPrevio, kind: 'earning' as const },
    ...(feriasVencidasValor > 0
      ? ([{ key: 'ferias_venc', label: 'Férias vencidas + 1/3', amount: feriasVencidasValor, kind: 'earning' as const }] as const)
      : []),
    ...(feriasProporcionais > 0
      ? ([{ key: 'ferias_prop', label: 'Férias proporcionais + 1/3', amount: feriasProporcionais, kind: 'earning' as const }] as const)
      : []),
    ...(decimoTerceiroProporcional > 0
      ? ([{ key: '13_prop', label: '13º salário proporcional', amount: decimoTerceiroProporcional, kind: 'earning' as const }] as const)
      : []),
    ...(multaFgts > 0
      ? ([
          {
            key: 'fgts_multa',
            label: `Multa FGTS (${(multaFgtsPercentual * 100).toFixed(0)}% - estimativa)`,
            amount: multaFgts,
            kind: 'earning' as const,
          },
        ] as const)
      : []),
    {
      key: 'fgts_info',
      label: 'Saldo FGTS estimado (info)',
      amount: saldoFgtsEstimado,
      kind: 'info' as const,
    },
    ...(totalDescontos > 0
      ? ([
          { key: 'inss_resc', label: 'INSS sobre verbas rescisórias', amount: inssRescisao, kind: 'deduction' as const },
          { key: 'irrf_resc', label: 'IRRF sobre verbas rescisórias', amount: irrfRescisao, kind: 'deduction' as const },
        ] as const)
      : []),
  ]

  return {
    total: totalLiquido, // Retorna o líquido (valor que o trabalhador recebe)
    totalBruto, // Adiciona campo para referência
    totalDescontos, // Adiciona campo para referência
    items,
  }
}

