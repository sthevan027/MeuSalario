export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function money(n: number) {
  // Mantém 2 casas como número (útil para persistir e somar).
  return Math.round((n + Number.EPSILON) * 100) / 100
}

