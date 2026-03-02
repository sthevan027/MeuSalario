/**
 * Configuração do Sentry para monitoramento de erros
 * 
 * Para configurar:
 * 1. Crie uma conta em https://sentry.io
 * 2. Crie um projeto Next.js
 * 3. Copie o DSN e adicione em NEXT_PUBLIC_SENTRY_DSN no .env
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

type SentryContext = {
  user?: {
    id?: string
    email?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

type SentryEvent = {
  message?: string
  level: SentryLevel
  timestamp: string
  platform: string
  environment: string
  contexts?: Record<string, unknown>
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: {
    id?: string
    email?: string
  }
  exception?: {
    values: Array<{
      type: string
      value: string
      stacktrace?: {
        frames: Array<{
          filename?: string
          function?: string
          lineno?: number
          colno?: number
        }>
      }
    }>
  }
}

let globalContext: SentryContext = {}

/**
 * Verifica se o Sentry está configurado
 */
export function isSentryEnabled(): boolean {
  return !!SENTRY_DSN && SENTRY_DSN.length > 0
}

/**
 * Define contexto global (usuário, tags)
 */
export function setContext(context: SentryContext): void {
  globalContext = { ...globalContext, ...context }
}

/**
 * Define usuário atual
 */
export function setUser(user: { id?: string; email?: string } | null): void {
  if (user) {
    globalContext.user = user
  } else {
    delete globalContext.user
  }
}

/**
 * Adiciona tags globais
 */
export function setTags(tags: Record<string, string>): void {
  globalContext.tags = { ...globalContext.tags, ...tags }
}

/**
 * Envia evento para o Sentry
 */
async function sendToSentry(event: SentryEvent): Promise<void> {
  if (!isSentryEnabled()) {
    console.warn('[Sentry] DSN não configurado. Evento não enviado:', event)
    return
  }

  try {
    const response = await fetch(SENTRY_DSN!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      console.error('[Sentry] Falha ao enviar evento:', response.status)
    }
  } catch (err) {
    console.error('[Sentry] Erro ao enviar evento:', err)
  }
}

/**
 * Captura uma exceção e envia para o Sentry
 */
export function captureException(
  error: Error | unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): void {
  const err = error instanceof Error ? error : new Error(String(error))
  
  const event: SentryEvent = {
    level: 'error',
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    environment: process.env.NODE_ENV || 'development',
    user: globalContext.user,
    tags: { ...globalContext.tags, ...context?.tags },
    extra: { ...globalContext.extra, ...context?.extra },
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split('\n')
                  .slice(1)
                  .map((line) => {
                    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
                    if (match) {
                      return {
                        function: match[1],
                        filename: match[2],
                        lineno: parseInt(match[3], 10),
                        colno: parseInt(match[4], 10),
                      }
                    }
                    return { filename: line.trim() }
                  })
                  .reverse(),
              }
            : undefined,
        },
      ],
    },
  }

  if (isSentryEnabled()) {
    sendToSentry(event)
  } else {
    console.error('[Sentry] Exceção capturada (não enviada - DSN não configurado):', err)
  }
}

/**
 * Captura uma mensagem e envia para o Sentry
 */
export function captureMessage(
  message: string,
  level: SentryLevel = 'info',
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): void {
  const event: SentryEvent = {
    message,
    level,
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    environment: process.env.NODE_ENV || 'development',
    user: globalContext.user,
    tags: { ...globalContext.tags, ...context?.tags },
    extra: { ...globalContext.extra, ...context?.extra },
  }

  if (isSentryEnabled()) {
    sendToSentry(event)
  } else {
    const logFn = level === 'error' || level === 'fatal' ? console.error : console.log
    logFn(`[Sentry] ${level.toUpperCase()}: ${message}`)
  }
}

/**
 * Wrapper para capturar erros em funções async
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: { tags?: Record<string, string> }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureException(error, context)
      throw error
    }
  }) as T
}

/**
 * Inicializa o Sentry (para uso no instrumentation.ts)
 */
export function initSentry(): void {
  if (!isSentryEnabled()) {
    console.log('[Sentry] DSN não configurado. Monitoramento de erros desabilitado.')
    console.log('[Sentry] Para habilitar, configure NEXT_PUBLIC_SENTRY_DSN no .env')
    return
  }

  setTags({
    app: 'meusalario',
    version: process.env.npm_package_version || '0.1.0',
  })

  console.log('[Sentry] Monitoramento de erros inicializado.')
}
