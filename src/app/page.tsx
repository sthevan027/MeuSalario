import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QuickSimulator } from '@/components/public/QuickSimulator'
import { Header } from '@/components/layout/Header'
import { Calculator, TrendingUp, BarChart3, FileText, Zap, History } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  // Se já estiver autenticado, não mostra LP: manda direto pro app.
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) redirect('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8">
        {/* Hero Section */}
        <section className="grid gap-8 py-8 sm:gap-12 sm:py-12 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 sm:px-4 sm:py-2 sm:text-sm">
              <Zap size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previsibilidade financeira para CLT e PJ</span>
              <span className="sm:hidden">CLT e PJ</span>
            </div>
            
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Saiba quanto você vai{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                receber
              </span>{' '}
              antes do pagamento
            </h1>
            
            <p className="text-base text-slate-300 leading-relaxed sm:text-lg">
              Entenda descontos, adicionais e horas extras. Simule CLT x PJ e rescisão. 
              Tudo com clareza, dashboards e sem surpresas no fim do mês.
            </p>
            
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link 
                href="/cadastro" 
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600 sm:px-6 sm:py-3"
              >
                Começar grátis
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 sm:px-6 sm:py-3"
              >
                Entrar
              </Link>
            </div>
            
            <p className="text-xs text-slate-400 sm:text-sm">
              💡 Valores são estimativas configuráveis. O objetivo é previsibilidade e clareza.
            </p>
          </div>

          <div className="order-first lg:order-last">
            <QuickSimulator />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 sm:py-16">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              Funcionalidades pensadas para dar clareza financeira total
            </p>
          </div>
          
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 sm:mb-4 sm:h-12 sm:w-12">
                <Calculator className="text-emerald-400 sm:h-6 sm:w-6" size={20} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Previsão do líquido</h3>
              <p className="text-sm text-slate-400 sm:text-base">
                Veja exatamente o impacto de horas extras, adicionais e descontos no seu salário.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 sm:mb-4 sm:h-12 sm:w-12">
                <TrendingUp className="text-emerald-400 sm:h-6 sm:w-6" size={20} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Comparador CLT x PJ</h3>
              <p className="text-sm text-slate-400 sm:text-base">
                Compare lado a lado com percentuais e impostos ajustáveis para tomar a melhor decisão.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 sm:mb-4 sm:h-12 sm:w-12">
                <FileText className="text-emerald-400 sm:h-6 sm:w-6" size={20} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Simulador de Rescisão</h3>
              <p className="text-sm text-slate-400 sm:text-base">
                Estimativas detalhadas: aviso prévio, férias vencidas, 13º proporcional e multa FGTS.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 sm:mb-4 sm:h-12 sm:w-12">
                <BarChart3 className="text-emerald-400 sm:h-6 sm:w-6" size={20} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Dashboard completo</h3>
              <p className="text-sm text-slate-400 sm:text-base">
                Visualize a evolução do seu salário com gráficos e indicadores detalhados.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 sm:mb-4 sm:h-12 sm:w-12">
                <History className="text-emerald-400 sm:h-6 sm:w-6" size={20} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Histórico mensal</h3>
              <p className="text-sm text-slate-400 sm:text-base">
                Acompanhe suas simulações ao longo do tempo e exporte para PDF/CSV.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 sm:mb-4 sm:h-12 sm:w-12">
                <Zap className="text-emerald-400 sm:h-6 sm:w-6" size={20} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Cálculos instantâneos</h3>
              <p className="text-sm text-slate-400 sm:text-base">
                Todos os cálculos acontecem em tempo real enquanto você ajusta os valores.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-16">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl">
              Planos transparentes
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              Comece grátis e faça upgrade quando precisar
            </p>
          </div>
          
          <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm sm:p-8">
              <div className="mb-2 text-xs font-semibold text-slate-400 sm:text-sm">FREE</div>
              <div className="mb-4 flex items-baseline gap-2 sm:mb-6">
                <span className="text-4xl font-bold text-white sm:text-5xl">R$ 0</span>
                <span className="text-sm text-slate-400 sm:text-base">/mês</span>
              </div>
              
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-slate-300">
                  <span className="text-emerald-400">✓</span>
                  <span>Simulação mensal básica</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <span className="text-emerald-400">✓</span>
                  <span>Visualização do salário atual</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem histórico e gráficos</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem comparador CLT x PJ</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span>✗</span>
                  <span>Sem simulador de rescisão</span>
                </li>
              </ul>
              
              <Link 
                href="/cadastro" 
                className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
              >
                Começar grátis
              </Link>
            </div>
            
            {/* Pro Plan */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm sm:p-8">
              <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[10px] font-bold text-white sm:px-4 sm:text-xs">
                POPULAR
              </div>
              
              <div className="mb-2 text-xs font-semibold text-emerald-400 sm:text-sm">PRO</div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white sm:text-5xl">R$ 7,90</span>
                <span className="text-sm text-slate-400 sm:text-base">/mês</span>
              </div>
              <div className="mb-4 text-xs text-slate-400 sm:mb-6 sm:text-sm">ou R$ 79/ano (economize 17%)</div>
              
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Tudo do plano Free</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Dashboard completo com gráficos</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Histórico mensal ilimitado</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Comparador CLT x PJ</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Simulador de rescisão</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="text-emerald-400">✓</span>
                  <span>Exportação PDF e CSV</span>
                </li>
              </ul>
              
              <Link 
                href="/cadastro" 
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
              >
                Começar teste grátis
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 text-center backdrop-blur-sm sm:p-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl">
              Pronto para ter controle total do seu salário?
            </h2>
            <p className="mx-auto mb-4 max-w-2xl text-base text-slate-300 sm:mb-6 sm:text-lg">
              Junte-se a centenas de profissionais que já descobriram a clareza financeira
            </p>
            <Link 
              href="/cadastro" 
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-base font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600 sm:px-8 sm:py-4 sm:text-lg"
            >
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 text-2xl font-bold">
                <span className="text-emerald-400">Meu</span>
                <span className="text-white">Salario</span>
              </div>
              <div className="text-sm text-slate-400">
                Previsibilidade financeira para CLT e PJ
              </div>
            </div>
            
            <div className="flex flex-wrap gap-12">
              <div>
                <div className="mb-3 text-sm font-semibold text-white">Produto</div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div><Link href="/como-funciona" className="transition-colors hover:text-emerald-400">Como funciona</Link></div>
                  <div><Link href="/planos" className="transition-colors hover:text-emerald-400">Planos</Link></div>
                  <div><Link href="/faq" className="transition-colors hover:text-emerald-400">FAQ</Link></div>
                </div>
              </div>
              
              <div>
                <div className="mb-3 text-sm font-semibold text-white">Legal</div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div><Link href="/termos" className="transition-colors hover:text-emerald-400">Termos de uso</Link></div>
                  <div><Link href="/privacidade" className="transition-colors hover:text-emerald-400">Privacidade</Link></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} MeuSalario. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
