'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { safeRedirectPath } from '@/lib/auth/safe-redirect-path'
import { createSupabaseActionClient } from '@/lib/supabase/server'

type ActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string }

async function getOrigin() {
  const h = await headers()
  return (
    h.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://meu-salario-lime.vercel.app' : 'http://localhost:3000')
  )
}

/**
 * Inicia o fluxo de login/cadastro com Google OAuth
 */
export async function signInWithGoogle(nextPath: string = '/app/dashboard'): Promise<ActionState> {
  const supabase = await createSupabaseActionClient()
  const origin = await getOrigin()
  const safePath = safeRedirectPath(nextPath)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safePath)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { ok: false, message: 'Erro ao iniciar login com Google' }
}

/**
 * Vincula conta Google a um usuário já autenticado
 */
export async function linkGoogleAccount(): Promise<ActionState> {
  const supabase = await createSupabaseActionClient()
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/app/conta`,
    },
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { ok: false, message: 'Erro ao vincular conta Google' }
}

/**
 * Remove vinculação com Google
 */
export async function unlinkGoogleAccount(): Promise<ActionState> {
  const supabase = await createSupabaseActionClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, message: 'Usuário não autenticado' }
  }

  const googleIdentity = user.identities?.find(i => i.provider === 'google')
  
  if (!googleIdentity) {
    return { ok: false, message: 'Conta Google não vinculada' }
  }

  const { error } = await supabase.auth.unlinkIdentity(googleIdentity)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, message: 'Conta Google desvinculada com sucesso' }
}

export async function signIn(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const nextPath = safeRedirectPath(String(formData.get('nextPath') ?? ''))

  const supabase = await createSupabaseActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { ok: false, message: error.message }

  redirect(nextPath)
}

export async function signUp(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  const supabase = await createSupabaseActionClient()
  const origin = await getOrigin()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { name },
    },
  })

  if (error) {
    if (error.message?.toLowerCase().includes('database error saving new user')) {
      return {
        ok: false,
        message:
          'Erro no banco ao criar o usuário. No Supabase, rode novamente o SQL `supabase/schema.sql` (principalmente a coluna `profiles.name` e o trigger `handle_new_user`).',
      }
    }
    return { ok: false, message: error.message }
  }

  if (data.user) {
    await supabase
      .from('profiles')
      .update({ name })
      .eq('id', data.user.id)
  }

  return {
    ok: true,
    message: 'Conta criada! Verifique seu email para confirmar o cadastro (se a confirmação estiver habilitada).',
  }
}

export async function requestPasswordReset(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim()

  const supabase = await createSupabaseActionClient()
  const origin = await getOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  })

  if (error) return { ok: false, message: error.message }

  return { ok: true, message: 'Link enviado! Verifique seu email para redefinir sua senha.' }
}

export async function verifyRecoveryCode(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const token = String(formData.get('token') ?? '').trim()

  if (!email || !token) {
    return { ok: false, message: 'Preencha o email e o código.' }
  }

  const supabase = await createSupabaseActionClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
      return {
        ok: false,
        message:
          'Código expirado ou inválido. Solicite um novo email em "Recuperar senha" e use o código mais recente (ele vale 1 hora).',
      }
    }
    return { ok: false, message: error.message }
  }

  redirect('/atualizar-senha')
}

export async function updatePassword(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get('password') ?? '')

  const supabase = await createSupabaseActionClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { ok: false, message: error.message }

  redirect('/app/dashboard')
}

export async function signOut() {
  const supabase = await createSupabaseActionClient()
  await supabase.auth.signOut()
  redirect('/')
}
