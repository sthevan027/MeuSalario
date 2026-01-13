import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-white/10 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-2xl font-bold">
          <span className="text-emerald-500">Meu</span>
          <span className="text-white">Salario</span>
        </Link>
        
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/como-funciona" className="text-slate-300 transition-colors hover:text-emerald-400">
            Como funciona
          </Link>
          <Link href="/planos" className="text-slate-300 transition-colors hover:text-emerald-400">
            Planos
          </Link>
          <Link href="/faq" className="text-slate-300 transition-colors hover:text-emerald-400">
            FAQ
          </Link>
        </nav>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            Entrar
          </Link>
          <Link 
            href="/cadastro" 
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  )
}
