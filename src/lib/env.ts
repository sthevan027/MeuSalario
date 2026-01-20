import { z } from 'zod'

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

const parsed = serverSchema.safeParse(rawEnv)
if (!parsed.success) {
  // Evita quebrar build quando .env não está configurado ainda.
  // Erros reais vão aparecer quando as rotas/clients forem usados.
  console.warn('[env] Variáveis ausentes/invalidas (ok no build):', parsed.error.issues)
}

export const env = (parsed.success ? parsed.data : rawEnv) as z.infer<typeof serverSchema>

export function isSupabaseConfigured() {
  return !!rawEnv.NEXT_PUBLIC_SUPABASE_URL && !!rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function isServiceRoleConfigured() {
  return !!rawEnv.SUPABASE_SERVICE_ROLE_KEY
}

export function isStripeConfigured() {
  return !!rawEnv.STRIPE_SECRET_KEY && !!rawEnv.STRIPE_WEBHOOK_SECRET
}

export function requireEnv<K extends keyof typeof rawEnv>(key: K): string {
  const value = (rawEnv[key] ?? '').toString()
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não configurada: ${String(key)}`)
  }
  return value
}

