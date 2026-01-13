import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function RecuperarSenhaPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Recuperar senha</h1>
        <p className="text-sm text-slate-300">
          Vamos te enviar um link de redefinição para o seu email.
        </p>
      </div>

      <ResetPasswordForm />

      <div className="text-sm">
        <Link href="/login" className="text-sky-300 hover:text-sky-200">
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}

