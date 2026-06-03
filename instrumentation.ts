// Polyfill para 'self' no Node.js - necessário para recharts
export async function register() {
  if (typeof self === 'undefined') {
    (global as any).self = global
  }

  // Inicializa Sentry server-side via @sentry/nextjs (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}
