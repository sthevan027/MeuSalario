import { describe, it, expect } from 'vitest'
import { sanitizeAuthError } from '../auth/sanitize-error'

describe('sanitizeAuthError', () => {
  it('oculta credenciais inválidas', () => {
    expect(sanitizeAuthError('Invalid login credentials')).toBe('Email ou senha incorretos.')
    expect(sanitizeAuthError('invalid email or password')).toBe('Email ou senha incorretos.')
  })

  it('detecta email não confirmado', () => {
    expect(sanitizeAuthError('Email not confirmed')).toBe(
      'Confirme seu email antes de entrar. Verifique sua caixa de entrada.'
    )
  })

  it('detecta email já cadastrado', () => {
    expect(sanitizeAuthError('User already registered')).toBe(
      'Este email já está cadastrado. Tente fazer login.'
    )
    expect(sanitizeAuthError('email already been registered')).toBe(
      'Este email já está cadastrado. Tente fazer login.'
    )
  })

  it('detecta senha fraca', () => {
    expect(sanitizeAuthError('Password should be at least 6 characters')).toBe(
      'A senha deve ter pelo menos 6 caracteres.'
    )
  })

  it('detecta rate limit do Supabase', () => {
    expect(sanitizeAuthError('rate limit exceeded')).toBe(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    )
    expect(sanitizeAuthError('Too many requests')).toBe(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    )
  })

  it('oculta erros de banco de dados', () => {
    expect(sanitizeAuthError('database error saving new user')).toBe(
      'Erro interno. Tente novamente em instantes.'
    )
    expect(sanitizeAuthError('Database error: unique constraint violated')).toBe(
      'Erro interno. Tente novamente em instantes.'
    )
  })

  it('não retorna mensagem contextual para token de recovery', () => {
    expect(sanitizeAuthError('token is invalid')).toBe('Ocorreu um erro. Tente novamente.')
    expect(sanitizeAuthError('otp expired')).toBe('Ocorreu um erro. Tente novamente.')
    expect(sanitizeAuthError('token has expired')).toBe('Ocorreu um erro. Tente novamente.')
  })

  it('não vaza detalhes de erros com "invalid" genérico', () => {
    // "invalid API key", "invalid grant", "invalid user type" NÃO devem cair
    // na branch de token — devem retornar o fallback genérico
    expect(sanitizeAuthError('invalid API key')).toBe('Ocorreu um erro. Tente novamente.')
    expect(sanitizeAuthError('invalid grant')).toBe('Ocorreu um erro. Tente novamente.')
    expect(sanitizeAuthError('invalid user type')).toBe('Ocorreu um erro. Tente novamente.')
  })

  it('retorna mensagem genérica para erros desconhecidos', () => {
    expect(sanitizeAuthError('unexpected error from internal service')).toBe(
      'Ocorreu um erro. Tente novamente.'
    )
    expect(sanitizeAuthError('')).toBe('Ocorreu um erro. Tente novamente.')
  })
})
