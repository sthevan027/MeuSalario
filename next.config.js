/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Impede clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Filtro XSS legacy (browsers antigos)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Controla informações enviadas no Referer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restringe APIs sensíveis do navegador
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // Opcional: OUTPUT_STANDALONE=true no build para gerar pasta standalone (Docker/deploy leve)
  ...(process.env.OUTPUT_STANDALONE === 'true' && { output: 'standalone' }),

  // Performance
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Otimização de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Otimizar webpack
  webpack: (config, { dev, isServer }) => {
    // Fix para "self is not defined" no servidor (recharts)
    if (isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          canvas: false,
        },
      };
    }
    
    // Dev: compilação mais rápida
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    return config;
  },
}

const { withSentryConfig } = require('@sentry/nextjs')

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG ?? '',
      project: process.env.SENTRY_PROJECT ?? '',
    })
  : nextConfig
