/**
 * Utilitários de exportação de simulações (PDF e CSV)
 */

import type { BreakdownItem } from '@/lib/calculators/types'

export type ExportData = {
  title: string
  subtitle?: string
  date: Date
  items: BreakdownItem[]
  summary: {
    bruto?: number
    descontos?: number
    liquido: number
  }
  metadata?: Record<string, string | number>
}

/**
 * Formata um valor monetário para exibição
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata uma data para exibição
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Gera conteúdo CSV a partir dos dados de exportação
 */
export function generateCSV(data: ExportData): string {
  const lines: string[] = []

  lines.push(`"${data.title}"`)
  if (data.subtitle) {
    lines.push(`"${data.subtitle}"`)
  }
  lines.push(`"Data: ${formatDate(data.date)}"`)
  lines.push('')

  if (data.metadata) {
    lines.push('"Dados da Simulação"')
    for (const [key, value] of Object.entries(data.metadata)) {
      const formattedValue = typeof value === 'number' ? formatCurrency(value) : value
      lines.push(`"${key}","${formattedValue}"`)
    }
    lines.push('')
  }

  lines.push('"Descrição","Tipo","Valor"')
  for (const item of data.items) {
    const tipo = item.kind === 'earning' ? 'Provento' : item.kind === 'deduction' ? 'Desconto' : 'Info'
    lines.push(`"${item.label}","${tipo}","${formatCurrency(item.amount)}"`)
  }

  lines.push('')
  lines.push('"Resumo"')
  if (data.summary.bruto !== undefined) {
    lines.push(`"Total Bruto","${formatCurrency(data.summary.bruto)}"`)
  }
  if (data.summary.descontos !== undefined) {
    lines.push(`"Total Descontos","${formatCurrency(data.summary.descontos)}"`)
  }
  lines.push(`"Total Líquido","${formatCurrency(data.summary.liquido)}"`)

  return lines.join('\n')
}

/**
 * Gera conteúdo HTML formatado para impressão/PDF
 */
export function generatePrintHTML(data: ExportData): string {
  const earnings = data.items.filter(i => i.kind === 'earning')
  const deductions = data.items.filter(i => i.kind === 'deduction')
  const infos = data.items.filter(i => i.kind === 'info')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - MeuSalario</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #10b981;
    }
    .header h1 {
      color: #10b981;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .header .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .header .date {
      color: #9ca3af;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    .metadata {
      background: #f9fafb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .metadata h2 {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .metadata-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .metadata-item .label { color: #6b7280; }
    .metadata-item .value { font-weight: 500; }
    .section {
      margin-bottom: 1.5rem;
    }
    .section h2 {
      font-size: 0.875rem;
      color: #374151;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .section h2.earnings { color: #059669; }
    .section h2.deductions { color: #dc2626; }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 0.875rem;
    }
    .item:last-child { border-bottom: none; }
    .item .label { color: #4b5563; }
    .item .value { font-weight: 500; }
    .item .value.earning { color: #059669; }
    .item .value.deduction { color: #dc2626; }
    .item .value.info { color: #6b7280; }
    .summary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-top: 2rem;
    }
    .summary h2 {
      font-size: 0.875rem;
      opacity: 0.9;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0;
      font-size: 0.875rem;
    }
    .summary-row.total {
      font-size: 1.25rem;
      font-weight: 700;
      padding-top: 0.75rem;
      margin-top: 0.5rem;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 0.75rem;
    }
    @media print {
      body { padding: 1rem; }
      .summary { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>MeuSalario</h1>
    <div class="title">${data.title}</div>
    ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
    <div class="date">Gerado em ${formatDate(data.date)}</div>
  </div>

  ${data.metadata ? `
  <div class="metadata">
    <h2>Dados da Simulação</h2>
    <div class="metadata-grid">
      ${Object.entries(data.metadata).map(([key, value]) => `
        <div class="metadata-item">
          <span class="label">${key}</span>
          <span class="value">${typeof value === 'number' ? formatCurrency(value) : value}</span>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${earnings.length > 0 ? `
  <div class="section">
    <h2 class="earnings">Proventos</h2>
    ${earnings.map(item => `
      <div class="item">
        <span class="label">${item.label}</span>
        <span class="value earning">+ ${formatCurrency(item.amount)}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${deductions.length > 0 ? `
  <div class="section">
    <h2 class="deductions">Descontos</h2>
    ${deductions.map(item => `
      <div class="item">
        <span class="label">${item.label}</span>
        <span class="value deduction">- ${formatCurrency(item.amount)}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${infos.length > 0 ? `
  <div class="section">
    <h2>Informações</h2>
    ${infos.map(item => `
      <div class="item">
        <span class="label">${item.label}</span>
        <span class="value info">${formatCurrency(item.amount)}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="summary">
    <h2>Resumo</h2>
    ${data.summary.bruto !== undefined ? `
      <div class="summary-row">
        <span>Total Bruto</span>
        <span>${formatCurrency(data.summary.bruto)}</span>
      </div>
    ` : ''}
    ${data.summary.descontos !== undefined ? `
      <div class="summary-row">
        <span>Total Descontos</span>
        <span>- ${formatCurrency(data.summary.descontos)}</span>
      </div>
    ` : ''}
    <div class="summary-row total">
      <span>Total Líquido</span>
      <span>${formatCurrency(data.summary.liquido)}</span>
    </div>
  </div>

  <div class="footer">
    <p>MeuSalario - Previsibilidade financeira para CLT e PJ</p>
    <p>Este documento é uma simulação e os valores podem variar.</p>
  </div>
</body>
</html>
`
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(data: ExportData, filename: string): void {
  const csv = generateCSV(data)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Abre janela de impressão para PDF
 */
export function printPDF(data: ExportData): void {
  const html = generatePrintHTML(data)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
