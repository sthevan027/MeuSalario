import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meu-salario-lime.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'MeuSalario - Previsibilidade Financeira para CLT e PJ',
    template: '%s | MeuSalario',
  },
  description: 'Saiba quanto você vai receber antes do pagamento. Simule CLT x PJ, rescisão e acompanhe sua evolução salarial. Sem surpresas no fim do mês.',
  keywords: ['salário', 'CLT', 'PJ', 'rescisão', 'horas extras', 'calculadora salarial', 'simulador salário', 'salário líquido'],
  authors: [{ name: 'MeuSalario' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: appUrl,
    title: 'MeuSalario - Previsibilidade Financeira para CLT e PJ',
    description: 'Saiba quanto você vai receber antes do pagamento. Simule CLT x PJ, rescisão e acompanhe sua evolução salarial.',
    siteName: 'MeuSalario',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeuSalario - Previsibilidade Financeira para CLT e PJ',
    description: 'Saiba quanto você vai receber antes do pagamento. Simule CLT x PJ, rescisão e acompanhe sua evolução salarial.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>{children}</body>
    </html>
  )
}

