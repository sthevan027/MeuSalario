// Polyfill para 'self' no Node.js (necessário para recharts no SSR)
if (typeof self === 'undefined') {
  (global as any).self = global
}
