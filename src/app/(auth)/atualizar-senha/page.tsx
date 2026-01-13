import Link from 'next/link'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export default function AtualizarSenhaPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Definir nova senha</h1>
        <p className="text-sm text-slate-300">Digite sua nova senha para concluir a recuperação.</p>
      </div>

      <UpdatePasswordForm />

      <div className="text-sm">
        <Link href="/login" className="text-sky-300 hover:text-sky-200">
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}

