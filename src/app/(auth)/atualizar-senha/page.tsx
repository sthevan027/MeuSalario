import Link from 'next/link'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export default function AtualizarSenhaPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Nova senha</h1>
        <p className="mt-2 text-slate-400">
          Crie uma senha forte para acessar sua conta com segurança.
        </p>
      </div>

      {/* Form */}
      <UpdatePasswordForm />

      {/* Footer */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
        >
          ← Voltar para o login
        </Link>
      </div>
    </div>
  )
}

