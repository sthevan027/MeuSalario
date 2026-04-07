// Polyfill para 'self' no Node.js (necessário para recharts no SSR)
if (typeof globalThis.self === 'undefined') {
  Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true })
}
