import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'
import { ValidateCodeForm } from '@/components/auth/ValidateCodeForm'

export default async function AtualizarSenhaPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          {user ? 'Nova senha' : 'Validar código'}
        </h1>
        <p className="mt-2 text-slate-400">
          {user
            ? 'Crie uma senha forte para acessar sua conta com segurança.'
            : 'Digite o email e o código que você recebeu no email de redefinição de senha.'}
        </p>
      </div>

      {/* Form: código (sem sessão) ou nova senha (com sessão) */}
      {user ? (
        <UpdatePasswordForm />
      ) : (
        <>
          <ValidateCodeForm />
          <p className="text-center text-xs text-slate-500">
            Ou use o link enviado no email para acessar esta página diretamente.
          </p>
        </>
      )}

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

