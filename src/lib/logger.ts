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
  data?: Record<string, unknown>
) {
  const entry: LogEntry = {
    level,
    message,
    context,
    data: data ? sanitizeLogData(data) : undefined,
    timestamp: new Date().toISOString(),
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
    data || ''
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
  info: (msg: string, ctx?: string, data?: Record<string, unknown>) => 
    log('info', msg, ctx, data),
  warn: (msg: string, ctx?: string, data?: Record<string, unknown>) => 
    log('warn', msg, ctx, data),
  error: (msg: string, ctx?: string, data?: Record<string, unknown>) => 
    log('error', msg, ctx, data),
}
