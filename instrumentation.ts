// Polyfill para 'self' no Node.js - necessário para recharts
export async function register() {
  if (typeof self === 'undefined') {
    (global as any).self = global
  }

  // Inicializa monitoramento de erros (Sentry)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { initSentry } = await import('@/lib/sentry')
    initSentry()
  }
}
