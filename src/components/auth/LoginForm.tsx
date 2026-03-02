'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signIn } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { GoogleSignInButton } from '@/components/auth/GoogleAuthButton'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Entrando...' : 'Entrar'}
    </Button>
  )
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useFormState(signIn, null)

  return (
    <div className="space-y-6">
      {/* Login com Google */}
      <GoogleSignInButton nextPath={nextPath} />

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-slate-900 px-4 text-slate-500">ou entre com email</span>
        </div>
      </div>

      {/* Form tradicional */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="nextPath" value={nextPath} />

        <Field label="Email" required>
          <Input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
        </Field>

        <Field label="Senha" required>
          <PasswordInput name="password" autoComplete="current-password" required />
        </Field>

        {state && !state.ok ? (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {state.message}
          </div>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  )
}
