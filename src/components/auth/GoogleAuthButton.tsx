'use client'

import { useState, useTransition } from 'react'
import { signInWithGoogle, linkGoogleAccount, unlinkGoogleAccount } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/Button'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

type GoogleSignInButtonProps = {
  nextPath?: string
  className?: string
}

export function GoogleSignInButton({ nextPath = '/app/dashboard', className }: GoogleSignInButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle(nextPath)
      if (!result.ok) {
        setError(result.message)
      }
    })
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
        onClick={handleClick}
        disabled={isPending}
      >
        <GoogleIcon className="w-5 h-5" />
        {isPending ? 'Conectando...' : 'Continuar com Google'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-rose-400">{error}</p>
      )}
    </div>
  )
}

type GoogleLinkButtonProps = {
  isLinked: boolean
  className?: string
  onSuccess?: () => void
}

export function GoogleLinkButton({ isLinked, className, onSuccess }: GoogleLinkButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLink = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await linkGoogleAccount()
      if (!result.ok) {
        setError(result.message)
      }
    })
  }

  const handleUnlink = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await unlinkGoogleAccount()
      if (result.ok) {
        setSuccess(result.message ?? 'Desvinculado com sucesso')
        onSuccess?.()
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <GoogleIcon className="w-6 h-6" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Google</p>
          <p className="text-xs text-slate-400">
            {isLinked ? 'Conta vinculada' : 'Não vinculada'}
          </p>
        </div>
        <Button
          type="button"
          variant={isLinked ? 'ghost' : 'secondary'}
          size="sm"
          onClick={isLinked ? handleUnlink : handleLink}
          disabled={isPending}
        >
          {isPending 
            ? 'Aguarde...' 
            : isLinked 
              ? 'Desvincular' 
              : 'Vincular'
          }
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-400">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-sm text-emerald-400">{success}</p>
      )}
    </div>
  )
}
