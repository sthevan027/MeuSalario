import { createClient } from '@supabase/supabase-js'

// Fallback values (2026) — used when Supabase is unavailable or table is empty
const FALLBACK_2026 = {
  inss_brackets: [
    { limit: 1621.0, rate: 0.075 },
    { limit: 2902.84, rate: 0.09 },
    { limit: 4354.27, rate: 0.12 },
    { limit: 8475.55, rate: 0.14 },
  ],
  inss_max: 988.10,
  irrf_brackets: [
    { limit: 2428.80, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 182.16 },
    { limit: 3751.05, rate: 0.15, deduction: 394.16 },
    { limit: 4664.68, rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.73 },
  ],
  irrf_isencao: 5000.0,
  // Ponto de equilíbrio da Lei 15.270/2025: complemento de isenção zera aqui
  irrf_isencao_break_even: 7786.72,
  deducao_dependente: 189.59,
  inss_pro_labore_rate: 0.11,
  das_anexo_iii: [
    { limiteAnual: 180_000, aliquota: 0.06, deducao: 0 },
    { limiteAnual: 360_000, aliquota: 0.112, deducao: 9_360 },
    { limiteAnual: 720_000, aliquota: 0.135, deducao: 17_640 },
    { limiteAnual: 1_800_000, aliquota: 0.16, deducao: 35_640 },
    { limiteAnual: 3_600_000, aliquota: 0.21, deducao: 125_640 },
    { limiteAnual: 4_800_000, aliquota: 0.33, deducao: 648_000 },
  ],
  das_anexo_v: [
    { limiteAnual: 180_000, aliquota: 0.155, deducao: 0 },
    { limiteAnual: 360_000, aliquota: 0.18, deducao: 4_500 },
    { limiteAnual: 720_000, aliquota: 0.195, deducao: 9_900 },
    { limiteAnual: 1_800_000, aliquota: 0.205, deducao: 17_100 },
    { limiteAnual: 3_600_000, aliquota: 0.23, deducao: 62_100 },
    { limiteAnual: 4_800_000, aliquota: 0.305, deducao: 540_000 },
  ],
} as const

export type TaxConfig = typeof FALLBACK_2026

// In-memory cache: valid for 1 hour per process lifetime (resets on redeploy)
let cachedConfig: TaxConfig | null = null
let cacheExpiry = 0
const CACHE_TTL_MS = 60 * 60 * 1000

export async function getTaxConfig(ano = new Date().getFullYear()): Promise<TaxConfig> {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiry) return cachedConfig

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return FALLBACK_2026

    const client = createClient(url, key)
    const { data, error } = await client
      .from('tax_config')
      .select('tipo, valor')
      .eq('ano', ano)

    if (error || !data?.length) return FALLBACK_2026

    const map: Record<string, unknown> = {}
    for (const row of data) {
      map[row.tipo] = row.valor
    }

    // Normalize null limit → Infinity for irrf_brackets (JSON doesn't have Infinity)
    if (Array.isArray(map.irrf_brackets)) {
      map.irrf_brackets = (map.irrf_brackets as Array<{ limit: number | null; rate: number; deduction: number }>).map(
        (b) => ({ ...b, limit: b.limit ?? Infinity })
      )
    }

    const config = { ...FALLBACK_2026, ...map } as TaxConfig
    cachedConfig = config
    cacheExpiry = now + CACHE_TTL_MS
    return config
  } catch {
    return FALLBACK_2026
  }
}

// Synchronous getter — returns cached value or fallback (no Supabase call)
// Use in calculators that run synchronously (client-side preview)
export function getTaxConfigSync(): TaxConfig {
  return cachedConfig ?? FALLBACK_2026
}
