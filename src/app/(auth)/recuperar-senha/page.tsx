import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function RecuperarSenhaPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Redefinir senha</h1>
        <p className="mt-2 text-slate-400">
          Digite seu email e enviaremos um link seguro para você criar uma nova senha.
        </p>
      </div>

      {/* Form */}
      <ResetPasswordForm />

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

