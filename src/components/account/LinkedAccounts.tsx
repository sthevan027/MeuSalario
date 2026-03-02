'use client'

import { GoogleLinkButton } from '@/components/auth/GoogleAuthButton'
import { useRouter } from 'next/navigation'

type LinkedAccountsProps = {
  isGoogleLinked: boolean
  userEmail?: string | null
}

export function LinkedAccounts({ isGoogleLinked, userEmail }: LinkedAccountsProps) {
  const router = useRouter()
  const isGmailUser = userEmail?.toLowerCase().endsWith('@gmail.com')

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-white">Contas Vinculadas</h2>
      
      {isGmailUser && !isGoogleLinked && (
        <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3">
          <p className="text-sm text-blue-200">
            Detectamos que você usa Gmail! Vincule sua conta Google para fazer login mais rápido.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <GoogleLinkButton 
          isLinked={isGoogleLinked} 
          onSuccess={() => router.refresh()}
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Vincular contas permite fazer login de forma mais rápida e segura.
      </p>
    </div>
  )
}
