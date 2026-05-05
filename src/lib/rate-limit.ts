/**
 * Rate limiter in-memory para Edge Runtime / Node.js.
 *
 * AVISO: funciona por instância do processo. Em deploy multi-instância (ex: Vercel
 * com várias funções em paralelo), use Upstash Redis ou Vercel KV para rate limiting
 * distribuído real.
 *
 * Para a maioria dos ataques de força bruta em auth, mesmo o rate limiting
 * por instância representa uma barreira significativa.
 */

interface RateLimitWindow {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitWindow>()

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, w] of store) {
    if (now >= w.resetAt) store.delete(key)
  }
}

export interface RateLimitOptions {
  /** Número máximo de requisições permitidas na janela */
  limit: number
  /** Tamanho da janela em segundos */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Verifica se a chave (geralmente IP) está dentro do limite.
 * Retorna `success: false` quando o limite foi atingido.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanup()

  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + options.windowSeconds * 1000
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: options.limit - 1, resetAt }
  }

  if (existing.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { success: true, remaining: options.limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Extrai o IP real do request, considerando proxies (Vercel, Cloudflare, etc.).
 * Prioriza x-real-ip (setado pelo Vercel/proxy confiável) sobre x-forwarded-for
 * que pode ser injetado pelo cliente. Use apenas para rate limiting, não para
 * controle de acesso ou decisões de segurança críticas.
 */
export function getClientIp(request: Request): string {
  const h = request instanceof Request ? request.headers : new Headers()
  return (
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
