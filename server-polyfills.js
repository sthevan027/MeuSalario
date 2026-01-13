// Polyfill para 'self' no Node.js - necessário para bibliotecas browser-only como recharts
if (typeof self === 'undefined') {
  global.self = global;
}
