'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseActionClient } from '@/lib/supabase/server'

type ActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string }

function getOrigin() {
  return headers().get('origin') ?? 'http://localhost:3000'
}

export async function signIn(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const nextPath = String(formData.get('nextPath') ?? '/app/dashboard') || '/app/dashboard'

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
      data: { name }, // Salva o nome no metadata do usuário
    },
  })

  if (error) {
    // Erro típico quando o trigger handle_new_user falha (schema desatualizado no Supabase)
    if (error.message?.toLowerCase().includes('database error saving new user')) {
      return {
        ok: false,
        message:
          'Erro no banco ao criar o usuário. No Supabase, rode novamente o SQL `supabase/schema.sql` (principalmente a coluna `profiles.name` e o trigger `handle_new_user`).',
      }
    }
    return { ok: false, message: error.message }
  }

  // Atualiza o profile com o nome
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

