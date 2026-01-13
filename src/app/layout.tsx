import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'MeuSalario - Previsibilidade Financeira para CLT e PJ',
  description: 'Saiba quanto você vai receber antes do pagamento. Simule CLT x PJ, rescisão e acompanhe sua evolução salarial. Sem surpresas no fim do mês.',
  keywords: ['salário', 'CLT', 'PJ', 'rescisão', 'horas extras', 'calculadora salarial'],
  authors: [{ name: 'MeuSalario' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#10b981',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

