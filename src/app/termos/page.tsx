import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
        <Link href="/" className="text-sm text-sky-300 hover:text-sky-200">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-semibold">Termos de uso</h1>
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Este é um texto placeholder para o MVP. Antes de lançar, substitua por Termos revisados por jurídico.
          </p>
          <p>
            O MeuSalario fornece estimativas e não substitui orientações profissionais (RH/contador/advogado).
          </p>
        </div>
      </main>
    </div>
  )
}

