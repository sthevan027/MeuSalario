'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-white/10 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="text-xl font-bold sm:text-2xl">
          <span className="text-emerald-500">Meu</span>
          <span className="text-white">Salario</span>
        </Link>
        
        {/* Desktop Navigation */}
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
          <Link href="/atualizacoes" className="text-slate-300 transition-colors hover:text-emerald-400">
            Atualizações
          </Link>
        </nav>
        
        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 sm:flex">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 md:hidden"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            <Link 
              href="/como-funciona" 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-emerald-400"
            >
              Como funciona
            </Link>
            <Link 
              href="/planos" 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-emerald-400"
            >
              Planos
            </Link>
            <Link 
              href="/faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-emerald-400"
            >
              FAQ
            </Link>
            <Link 
              href="/atualizacoes" 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-emerald-400"
            >
              Atualizações
            </Link>
            <div className="my-2 border-t border-white/10" />
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Entrar
            </Link>
            <Link 
              href="/cadastro" 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
