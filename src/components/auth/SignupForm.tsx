'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { signUp } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { GoogleSignInButton } from '@/components/auth/GoogleAuthButton'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Criando...' : 'Criar conta'}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = (formData: FormData) => {
    const pass = formData.get('password') as string
    const confirmPass = formData.get('confirmPassword') as string

    if (pass !== confirmPass) {
      setPasswordError('As senhas não coincidem')
      return
    }

    setPasswordError('')
    formAction(formData)
  }

  return (
    <div className="space-y-6">
      {/* Cadastro com Google */}
      <GoogleSignInButton nextPath="/app/dashboard" />

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-slate-900 px-4 text-slate-500">ou cadastre com email</span>
        </div>
      </div>

      {/* Form tradicional */}
      <form action={handleSubmit} className="space-y-4">
        <Field label="Nome completo" required>
          <Input name="name" type="text" autoComplete="name" required placeholder="Seu nome completo" />
        </Field>

        <Field label="Email" required>
          <Input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
        </Field>

        <Field label="Senha" hint="mín. 6 caracteres" required>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label="Confirmar senha" required>
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordError}
          />
        </Field>

        {state ? (
          <div
            className={[
              'rounded-lg border px-3 py-2 text-sm',
              state.ok
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-50'
                : 'border-rose-400/20 bg-rose-500/10 text-rose-100',
            ].join(' ')}
          >
            {state.message}
          </div>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  )
}
