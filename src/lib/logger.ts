import { PostHog } from 'posthog-node'
import { createBugReport } from '@/lib/linear/client'

const serverPostHog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
)

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, unknown>
  timestamp: string
}

export function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  userId?: string
) {
  const entry: LogEntry = {
    level,
    message,
    context,
    data: data ? sanitizeLogData(data) : undefined,
    timestamp: new Date().toISOString(),
  }

  // Envia para PostHog server-side se for erro
  if (level === 'error') {
    serverPostHog.capture({
      distinctId: userId || 'anonymous_server_error',
      event: '$exception',
      properties: {
        $exception_message: message,
        context,
        ...data
      },
    })
  }

  // Em produção: cria issue no Linear automaticamente para erros
  if (process.env.NODE_ENV === 'production' && level === 'error') {
    const err = new Error(message)
    createBugReport(err, context ?? 'Unknown', userId).catch(e =>
      console.error('[Logger] Falha ao criar issue no Linear:', e)
    )
  }

  if (process.env.NODE_ENV === 'production') {
    if (level === 'error' || level === 'warn') {
      console[level](JSON.stringify(entry))
    }
    return
  }

  console[level](
    `[${entry.timestamp}] [${level.toUpperCase()}]`,
    context ? `[${context}]` : '',
    message,
    data || '',
    userId ? `[User: ${userId}]` : ''
  )
}

function sanitizeLogData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitive = [
    'password', 'token', 'secret', 'key', 'cpf', 
    'cnpj', 'document', 'alfred_context'
  ]
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      sensitive.some(s => k.toLowerCase().includes(s)) 
        ? '[REDACTED]' 
        : v
    ])
  )
}

export const logger = {
  info: (msg: string, ctx?: string, data?: Record<string, unknown>, userId?: string) => 
    log('info', msg, ctx, data, userId),
  warn: (msg: string, ctx?: string, data?: Record<string, unknown>, userId?: string) => 
    log('warn', msg, ctx, data, userId),
  error: (msg: string, ctx?: string, data?: Record<string, unknown>, userId?: string) => 
    log('error', msg, ctx, data, userId),
}
