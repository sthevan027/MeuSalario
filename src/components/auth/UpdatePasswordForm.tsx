'use client'

import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { useState } from 'react'
import { updatePassword } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordInput } from '@/components/ui/PasswordInput'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar nova senha'}
    </Button>
  )
}

export function UpdatePasswordForm() {
  const [state, formAction] = useFormState(updatePassword, null)
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
    <form action={handleSubmit} className="space-y-4">
      <Field label="Nova senha" hint="mín. 6 caracteres" required>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <Field label="Confirmar nova senha" required>
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

      {state && !state.ok ? (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}
