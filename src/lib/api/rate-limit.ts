interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export async function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `${action}:${identifier}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

// Limites por endpoint:
export const RATE_LIMITS = {
  'ai-contracts': { limit: 10, window: 60 },
  'ai-proposals': { limit: 10, window: 60 },
  'ai-fiscal': { limit: 20, window: 60 },
  'ai-reports': { limit: 10, window: 60 },
  'ai-chat': { limit: 30, window: 60 },
  'proposals-accept': { limit: 5, window: 300 },
  'proposals-refuse': { limit: 5, window: 300 },
  'fiscal-calculate': { limit: 30, window: 60 },
  'auth-login': { limit: 10, window: 900 }, // 15min
  'auth-signup': { limit: 3, window: 3600 }, // 1h
}

// Aliases para compatibilidade com rotas legadas
export const LIMITS = RATE_LIMITS;
export { createNextResponse as rateLimitResponse };

function createNextResponse() {
  return (import('next/server')).then(mod => 
    mod.NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento.' },
      { status: 429 }
    )
  );
}
