/**
 * Centralized logging utility for Alfred
 */
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  // Em produção, aqui integraríamos com Sentry, Logtail, etc.
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${timestamp}] [Alfred Error] ${context ? `${context}: ` : ''}${message}`, { stack })
  } else {
    console.error(`[Alfred Error] ${context ? `${context}: ` : ''}`, error)
  }
}

export function logInfo(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Alfred Info] ${message}`, data || '')
  }
}
