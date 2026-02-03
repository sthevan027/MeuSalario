'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { verifyRecoveryCode } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Validando...' : 'Validar código'}
    </Button>
  )
}

export function ValidateCodeForm() {
  const [state, formAction] = useFormState(verifyRecoveryCode, null)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email" required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@exemplo.com"
        />
      </Field>

      <Field
        label="Código do email"
        hint="Digite o código numérico que você recebeu no email de redefinição"
        required
      >
        <Input
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="Ex: 13592843"
          maxLength={8}
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
          <p className="m-0">{state.message}</p>
          {!state.ok && (
            <Link
              href="/recuperar-senha"
              className="mt-2 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Solicitar novo código →
            </Link>
          )}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}
