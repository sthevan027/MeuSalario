/**
 * Limites exibidos na UI quando o banco ainda não foi migrado ou como fallback de documentação.
 * O valor autoritativo para novos usuários FREE está em `app_config.free_simulations_limit` (Supabase).
 */
export function getDefaultFreeSimulationsLimit(): number {
  const raw = process.env.NEXT_PUBLIC_FREE_SIMULATIONS_DEFAULT
  if (raw === undefined || raw === '') return 3
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 3
}

export function getDefaultFreeComparisonsLimit(): number {
  const raw = process.env.NEXT_PUBLIC_FREE_COMPARISONS_DEFAULT
  if (raw === undefined || raw === '') return 2
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 2
}

export function getDefaultFreeCompatibilityLimit(): number {
  const raw = process.env.NEXT_PUBLIC_FREE_COMPATIBILITY_DEFAULT
  if (raw === undefined || raw === '') return 2
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 2
}
