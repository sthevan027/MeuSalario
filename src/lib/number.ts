export function parseBRNumber(input: string) {
  const s = String(input ?? '').trim()
  if (!s) return NaN

  // Aceita formato pt-BR: 3.500,25
  if (s.includes(',')) {
    const normalized = s.replace(/\./g, '').replace(',', '.')
    return Number(normalized)
  }

  // Heurística: se terminar com 3 dígitos após ponto, trata como milhar (3.500 => 3500)
  if (s.includes('.')) {
    const parts = s.split('.')
    const last = parts[parts.length - 1] ?? ''
    if (last.length === 3 && parts.length > 1) {
      return Number(parts.join(''))
    }
  }

  return Number(s)
}

export function toNumberOr(input: unknown, fallback = 0) {
  const raw = typeof input === 'string' ? input : input == null ? '' : String(input)
  const n = parseBRNumber(raw)
  return Number.isFinite(n) ? n : fallback
}

