import { describe, it, expect } from 'vitest'
import {
  parseExtratoCSV,
  parseValorMonetario,
  parseDataExtrato,
  agruparReceitaPorMes,
} from '../extrato-import'

describe('parseValorMonetario', () => {
  it('aceita formato BR (1.234,56)', () => {
    expect(parseValorMonetario('1.234,56')).toBe(1234.56)
  })

  it('aceita formato com vírgula sem milhar (350,00)', () => {
    expect(parseValorMonetario('350,00')).toBe(350)
  })

  it('aceita formato US/ISO (1234.56)', () => {
    expect(parseValorMonetario('1234.56')).toBe(1234.56)
  })

  it('aceita prefixo R$', () => {
    expect(parseValorMonetario('R$ 1.500,00')).toBe(1500)
  })

  it('aceita negativo com sinal', () => {
    expect(parseValorMonetario('-250,00')).toBe(-250)
  })

  it('aceita negativo entre parênteses', () => {
    expect(parseValorMonetario('(250,00)')).toBe(-250)
  })

  it('devolve null pra string vazia ou inválida', () => {
    expect(parseValorMonetario('')).toBeNull()
    expect(parseValorMonetario('abc')).toBeNull()
  })
})

describe('parseDataExtrato', () => {
  it('aceita DD/MM/YYYY', () => {
    expect(parseDataExtrato('15/09/2026')).toBe('2026-09-15')
  })

  it('aceita DD-MM-YYYY', () => {
    expect(parseDataExtrato('15-09-2026')).toBe('2026-09-15')
  })

  it('aceita YYYY-MM-DD', () => {
    expect(parseDataExtrato('2026-09-15')).toBe('2026-09-15')
  })

  it('aceita ano com 2 dígitos', () => {
    expect(parseDataExtrato('15/09/26')).toBe('2026-09-15')
  })

  it('devolve null pra mês/dia inválido', () => {
    expect(parseDataExtrato('15/13/2026')).toBeNull()
    expect(parseDataExtrato('não é data')).toBeNull()
  })
})

describe('parseExtratoCSV — formato com coluna Valor única (padrão Nubank-like)', () => {
  const csv = `Data,Valor,Descrição
15/09/2026,"1.500,00",Pagamento cliente A
20/09/2026,"-350,00",Aluguel do escritório
28/09/2026,"2.000,00",Pagamento cliente B`

  it('detecta a vírgula como delimitador e as colunas certas', () => {
    const r = parseExtratoCSV(csv)
    expect(r.delimitador).toBe(',')
    expect(r.colunas).not.toBeNull()
    expect(r.erros).toHaveLength(0)
  })

  it('extrai as 3 transações corretamente', () => {
    const r = parseExtratoCSV(csv)
    expect(r.transacoes).toHaveLength(3)
    expect(r.transacoes[0]).toMatchObject({ data: '2026-09-15', valor: 1500, descricao: 'Pagamento cliente A' })
    expect(r.transacoes[1].valor).toBe(-350)
  })
})

describe('parseExtratoCSV — formato com Débito/Crédito separados (padrão banco tradicional)', () => {
  const csv = `Data;Histórico;Débito;Crédito
01/09/2026;Recebimento PIX;;4.200,00
05/09/2026;Tarifa bancária;35,00;
10/09/2026;Recebimento cliente;;3.100,50`

  it('detecta ponto-e-vírgula como delimitador', () => {
    const r = parseExtratoCSV(csv)
    expect(r.delimitador).toBe(';')
  })

  it('combina débito/crédito num valor com sinal', () => {
    const r = parseExtratoCSV(csv)
    expect(r.transacoes).toHaveLength(3)
    expect(r.transacoes[0].valor).toBe(4200)
    expect(r.transacoes[1].valor).toBe(-35)
    expect(r.transacoes[2].valor).toBe(3100.5)
  })
})

describe('parseExtratoCSV — casos de erro', () => {
  it('reporta erro quando não acha colunas de data/valor', () => {
    const csv = `Coluna A,Coluna B\nx,y`
    const r = parseExtratoCSV(csv)
    expect(r.colunas).toBeNull()
    expect(r.erros.length).toBeGreaterThan(0)
  })

  it('devolve resultado vazio pra arquivo vazio', () => {
    const r = parseExtratoCSV('')
    expect(r.transacoes).toHaveLength(0)
    expect(r.erros.length).toBeGreaterThan(0)
  })

  it('reporta linha com data inválida sem quebrar o resto do parse', () => {
    const csv = `Data,Valor,Descrição\ndata-invalida,100,00,teste\n15/09/2026,500,00,ok`
    const r = parseExtratoCSV(csv)
    expect(r.erros.length).toBeGreaterThanOrEqual(1)
  })
})

describe('agruparReceitaPorMes', () => {
  const csv = `Data,Valor,Descrição
05/09/2026,"1.000,00",Cliente A
15/09/2026,"-200,00",Despesa
20/09/2026,"1.500,00",Cliente B
03/10/2026,"3.000,00",Cliente C`

  it('agrupa só as entradas positivas por mês de competência', () => {
    const { transacoes } = parseExtratoCSV(csv)
    const agrupado = agruparReceitaPorMes(transacoes)

    expect(agrupado).toEqual([
      { competencia: '2026-09-01', valor: 2500, fonte: 'extrato' },
      { competencia: '2026-10-01', valor: 3000, fonte: 'extrato' },
    ])
  })

  it('ignora despesas (valores negativos)', () => {
    const { transacoes } = parseExtratoCSV(csv)
    const agrupado = agruparReceitaPorMes(transacoes)
    const setembro = agrupado.find((e) => e.competencia === '2026-09-01')
    expect(setembro?.valor).toBe(2500) // não inclui a despesa de -200
  })
})
