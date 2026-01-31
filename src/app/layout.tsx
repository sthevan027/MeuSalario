import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://meusalario.app'),
  title: {
    default: 'MeuSalario - Previsibilidade Financeira para CLT e PJ',
    template: '%s | MeuSalario',
  },
  description: 'Saiba quanto você vai receber antes do pagamento. Simule CLT x PJ, rescisão e acompanhe sua evolução salarial. Sem surpresas no fim do mês.',
  keywords: ['salário', 'CLT', 'PJ', 'rescisão', 'horas extras', 'calculadora salarial', 'simulador salário', 'salário líquido'],
  authors: [{ name: 'MeuSalario' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#10b981',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://meusalario.app',
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
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

