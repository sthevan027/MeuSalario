/**
 * Normaliza preço vindo do Postgres (numeric pode vir como string ou number).
 * Evita valor errado no checkout Asaas vs. site quando o tipo não é número puro.
 */
export function parsePlanMoney(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return Math.round(value * 100) / 100
  }
  const s = String(value).trim().replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(s)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100) / 100
}
