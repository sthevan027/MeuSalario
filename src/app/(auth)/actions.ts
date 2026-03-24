'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseActionClient } from '@/lib/supabase/server'

type ActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string }

/**
 * Garante que o path de redirect é sempre relativo ao próprio app.
 * Previne open redirect: qualquer valor externo (ex.: https://evil.com) vira /app/dashboard.
 */
function safeRedirectPath(raw: string | null | undefined): string {
  const fallback = '/app/dashboard'
  if (!raw) return fallback
  const s = String(raw).trim()
  // Deve começar com '/' mas não com '//' (protocol-relative URL)
  if (!s.startsWith('/') || s.startsWith('//')) return fallback
  try {
    // Usa URL para normalizar e garantir que não é URL absoluta disfarçada
    const url = new URL(s, 'http://localhost')
    // Se hostname mudou, era URL absoluta
    if (url.hostname !== 'localhost') return fallback
    return url.pathname + (url.search || '') + (url.hash || '')
  } catch {
    return fallback
  }
}

function getOrigin() {
  return (
    headers().get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://meu-salario-lime.vercel.app' : 'http://localhost:3000')
  )
}

/**
 * Inicia o fluxo de login/cadastro com Google OAuth
 */
export async function signInWithGoogle(nextPath: string = '/app/dashboard'): Promise<ActionState> {
  const supabase = createSupabaseActionClient()
  const origin = getOrigin()
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
  const supabase = createSupabaseActionClient()
  const origin = getOrigin()

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
  const supabase = createSupabaseActionClient()

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

  const supabase = createSupabaseActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { ok: false, message: error.message }

  redirect(nextPath)
}

export async function signUp(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  const supabase = createSupabaseActionClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/callback`,
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

  const supabase = createSupabaseActionClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getOrigin()}/auth/callback?type=recovery`,
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

  const supabase = createSupabaseActionClient()
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

  const supabase = createSupabaseActionClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { ok: false, message: error.message }

  redirect('/app/dashboard')
}

export async function signOut() {
  const supabase = createSupabaseActionClient()
  await supabase.auth.signOut()
  redirect('/')
}
