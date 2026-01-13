import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
        <Link href="/" className="text-sm text-sky-300 hover:text-sky-200">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-semibold">Política de privacidade</h1>
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Este é um texto placeholder para o MVP. Antes de lançar, substitua por uma Política de Privacidade completa
            (LGPD).
          </p>
          <p>
            Você pode solicitar exclusão de conta e dados (a funcionalidade será adicionada na área de conta).
          </p>
        </div>
      </main>
    </div>
  )
}

