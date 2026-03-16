import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MeuSalario',
    short_name: 'MeuSalario',
    description: 'Previsibilidade financeira para CLT e PJ.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#10b981',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
