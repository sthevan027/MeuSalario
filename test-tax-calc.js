// Teste rápido dos cálculos de INSS e IRRF
// Execute com: node test-tax-calc.js

function money(value) {
  return Math.round(value * 100) / 100
}

function calcularINSS(salarioBruto) {
  if (salarioBruto <= 0) return 0

  const INSS_BRACKETS = [
    { limit: 1320.0, rate: 0.075 },
    { limit: 2571.29, rate: 0.09 },
    { limit: 3856.94, rate: 0.12 },
    { limit: 7507.49, rate: 0.14 },
  ]

  const INSS_MAX = 908.85

  let inssTotal = 0
  let previousLimit = 0

  for (const bracket of INSS_BRACKETS) {
    if (salarioBruto > previousLimit) {
      const faixaBase = Math.min(salarioBruto, bracket.limit) - previousLimit
      inssTotal += faixaBase * bracket.rate
      previousLimit = bracket.limit
    } else {
      break
    }
  }

  return money(Math.min(inssTotal, INSS_MAX))
}

function calcularIRRF(salarioBruto, inss) {
  const IRRF_BRACKETS = [
    { limit: 2112.0, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 158.4 },
    { limit: 3751.05, rate: 0.15, deduction: 370.4 },
    { limit: 4664.68, rate: 0.225, deduction: 651.73 },
    { limit: Infinity, rate: 0.275, deduction: 884.96 },
  ]

  const baseCalculo = salarioBruto - inss

  if (baseCalculo <= 0) return 0

  for (const bracket of IRRF_BRACKETS) {
    if (baseCalculo <= bracket.limit) {
      const irrf = baseCalculo * bracket.rate - bracket.deduction
      return money(Math.max(0, irrf))
    }
  }

  return 0
}

// Testes
console.log('\n=== TESTES DE CÁLCULO DE INSS E IRRF ===\n')

const testCases = [
  { salario: 1320, nome: 'Salário mínimo' },
  { salario: 2000, nome: 'R$ 2.000,00' },
  { salario: 3000, nome: 'R$ 3.000,00' },
  { salario: 4000, nome: 'R$ 4.000,00' },
  { salario: 5000, nome: 'R$ 5.000,00' },
  { salario: 7000, nome: 'R$ 7.000,00' },
  { salario: 10000, nome: 'R$ 10.000,00' },
]

for (const test of testCases) {
  const inss = calcularINSS(test.salario)
  const irrf = calcularIRRF(test.salario, inss)
  const total = inss + irrf
  const liquido = test.salario - total

  console.log(`${test.nome}:`)
  console.log(`  Salário Bruto: R$ ${test.salario.toFixed(2)}`)
  console.log(`  INSS:          R$ ${inss.toFixed(2)} (${((inss / test.salario) * 100).toFixed(2)}%)`)
  console.log(`  IRRF:          R$ ${irrf.toFixed(2)} (${((irrf / test.salario) * 100).toFixed(2)}%)`)
  console.log(`  Total desc.:   R$ ${total.toFixed(2)} (${((total / test.salario) * 100).toFixed(2)}%)`)
  console.log(`  Líquido:       R$ ${liquido.toFixed(2)}`)
  console.log('')
}

console.log('✓ Testes concluídos!\n')
