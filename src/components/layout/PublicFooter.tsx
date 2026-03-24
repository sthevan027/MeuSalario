import Link from 'next/link'

/** Rodapé padrão das páginas públicas (LP), alinhado a max-w-7xl como o restante do site. */
export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 text-2xl font-bold">
              <span className="text-emerald-400">Meu</span>
              <span className="text-white">Salario</span>
            </div>
            <div className="text-sm text-slate-400">Previsibilidade financeira para CLT e PJ</div>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-12">
            <div>
              <div className="mb-3 text-sm font-semibold text-white">Produto</div>
              <div className="space-y-2 text-sm text-slate-400">
                <div>
                  <Link href="/como-funciona" className="transition-colors hover:text-emerald-400">
                    Como funciona
                  </Link>
                </div>
                <div>
                  <Link href="/planos" className="transition-colors hover:text-emerald-400">
                    Planos
                  </Link>
                </div>
                <div>
                  <Link href="/faq" className="transition-colors hover:text-emerald-400">
                    FAQ
                  </Link>
                </div>
                <div>
                  <Link href="/atualizacoes" className="transition-colors hover:text-emerald-400">
                    Atualizações
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-white">Legal</div>
              <div className="space-y-2 text-sm text-slate-400">
                <div>
                  <Link href="/termos" className="transition-colors hover:text-emerald-400">
                    Termos de uso
                  </Link>
                </div>
                <div>
                  <Link href="/privacidade" className="transition-colors hover:text-emerald-400">
                    Privacidade
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MeuSalario. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
