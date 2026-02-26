import Link from 'next/link'
import { Header } from '@/components/layout/Header'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 lg:px-8">
        <div className="py-16 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white lg:text-5xl">Perguntas frequentes</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Tire suas dúvidas sobre o MeuSalario
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-3">
                Os cálculos são precisos?
              </h2>
              <p className="text-slate-300">
                Os cálculos são estimativas baseadas em regras configuráveis. Recomendamos sempre validar
                os valores finais com seu RH ou contador, pois cada caso pode ter particularidades.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-3">
                Posso usar sem criar conta?
              </h2>
              <p className="text-slate-300">
                Sim! Na home você tem acesso ao simulador rápido sem login. Para salvar suas simulações,
                ver histórico e acessar recursos avançados, é necessário criar uma conta gratuita.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-3">
                Qual a diferença entre Free e Pro?
              </h2>
              <p className="text-slate-300">
                O plano Free permite simulações básicas. O plano Pro (R$ 10/mês) inclui dashboard completo,
                gráficos, histórico mensal, comparador CLT x PJ, simulador de rescisão e exportação de dados.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-3">
                Meus dados estão seguros?
              </h2>
              <p className="text-slate-300">
                Sim. Todos os dados são criptografados e armazenados de forma segura. Você tem controle total
                sobre suas informações e pode excluir sua conta a qualquer momento.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-3">
                Como cancelo a assinatura Pro?
              </h2>
              <p className="text-slate-300">
                Você pode cancelar a qualquer momento pela área &ldquo;Minha conta&rdquo;. Não há multas ou taxas de
                cancelamento. Sua assinatura permanece ativa até o fim do período pago.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-3">
                Posso usar para quantas pessoas?
              </h2>
              <p className="text-slate-300">
                Cada conta é individual. Se você precisa gerenciar simulações de múltiplas pessoas (ex: equipe de RH),
                entre em contato para planos corporativos.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-300 mb-4">Não encontrou sua resposta?</p>
            <Link href="/cadastro" className="btn-primary">
              Criar conta e testar grátis
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
