import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  ip: string,
  action: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${action}:${ip}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { 
    allowed: true, 
    remaining: limit - entry.count, 
    resetAt: entry.resetAt 
  }
}

export const LIMITS = {
  'ai-generate':        { limit: 10,  window: 60  },
  'ai-chat':            { limit: 30,  window: 60  },
  'proposals-accept':   { limit: 5,   window: 300 },
  'proposals-refuse':   { limit: 5,   window: 300 },
  'contract-sign':      { limit: 5,   window: 300 },
  'fiscal-calculate':   { limit: 30,  window: 60  },
  'client-import':      { limit: 3,   window: 3600 },
  'auth-login':         { limit: 10,  window: 900 },
  'auth-signup':        { limit: 3,   window: 3600 },
  'context-regenerate': { limit: 5,   window: 3600 },
  'report-export':      { limit: 10,  window: 3600 },
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Muitas requisições. Tente novamente em breve.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    }
  )
}
