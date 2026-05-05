/**
 * Converte erros internos do Supabase em mensagens seguras para o cliente.
 * Evita vazar detalhes de implementação (nomes de tabela, SQL, stack traces, etc.).
 */
export function sanitizeAuthError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Email ou senha incorretos.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.'
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Este email já está cadastrado. Tente fazer login.'
  }
  if (msg.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
  if (msg.includes('database error')) {
    return 'Erro interno. Tente novamente em instantes.'
  }
  if (msg.includes('expired') || msg.includes('otp') || msg.includes('token is invalid')) {
    return 'Código expirado ou inválido. Solicite um novo email de recuperação.'
  }
  // Fallback genérico — não vaza detalhes técnicos
  return 'Ocorreu um erro. Tente novamente.'
}
