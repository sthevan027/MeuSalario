import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Criar sua conta</h1>
        <p className="mt-2 text-slate-400">Grátis para sempre • Sem cartão de crédito</p>
      </div>

      {/* Form */}
      <SignupForm />

      {/* Footer */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
        </div>

        <div className="text-center text-sm text-slate-500">
          Já tem uma conta?{' '}
          <Link 
            href="/login" 
            className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
