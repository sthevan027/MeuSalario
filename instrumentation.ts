// Polyfill para 'self' no Node.js - necessário para recharts
export async function register() {
  if (typeof self === 'undefined') {
    (global as any).self = global
  }
}
