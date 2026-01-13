'use client'

import { experimental_useFormState as useFormState, experimental_useFormStatus as useFormStatus } from 'react-dom'
import { requestPasswordReset } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Enviando...' : 'Enviar link'}
    </Button>
  )
}

export function ResetPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, null)

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
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
  )
}

