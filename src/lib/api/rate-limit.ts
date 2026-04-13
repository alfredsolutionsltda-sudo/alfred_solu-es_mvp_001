import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Configurações por endpoint
const limiters = {
  'ai-generate': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60s'),
    analytics: true,
    prefix: 'alfred:ai-generate',
  }),
  'ai-chat': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60s'),
    analytics: true,
    prefix: 'alfred:ai-chat',
  }),
  'contract-sign': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '300s'),
    analytics: true,
    prefix: 'alfred:contract-sign',
  }),
  'proposals-accept': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '300s'),
    analytics: true,
    prefix: 'alfred:proposals-accept',
  }),
  'fiscal-calculate': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60s'),
    analytics: true,
    prefix: 'alfred:fiscal-calculate',
  }),
  'client-import': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '3600s'),
    analytics: true,
    prefix: 'alfred:client-import',
  }),
  'auth-login': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '900s'),
    analytics: true,
    prefix: 'alfred:auth-login',
  }),
  'auth-signup': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '3600s'),
    analytics: true,
    prefix: 'alfred:auth-signup',
  }),
  'context-regenerate': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '3600s'),
    analytics: true,
    prefix: 'alfred:context-regenerate',
  }),
  'webhook': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '60s'),
    analytics: true,
    prefix: 'alfred:webhook',
  }),
  'clients-update-scores': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '3600s'),
    analytics: true,
    prefix: 'alfred:clients-update-scores',
  }),
  'feedback': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '3600s'),
    analytics: true,
    prefix: 'alfred:feedback',
  }),
  'fiscal-mark-paid': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '60s'),
    analytics: true,
    prefix: 'alfred:fiscal-mark-paid',
  }),
  'proposals-followup': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60s'),
    analytics: true,
    prefix: 'alfred:proposals-followup',
  }),
  'report-export': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '3600s'),
    analytics: true,
    prefix: 'alfred:report-export',
  }),
}

export type RateLimitAction = keyof typeof limiters

export async function checkRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  response?: NextResponse
}> {
  try {
    const limiter = limiters[action]
    if (!limiter) {
      return { allowed: true, remaining: 999, resetAt: 0 }
    }

    const result = await limiter.limit(identifier)

    if (!result.success) {
      const retryAfter = Math.ceil(
        (result.reset - Date.now()) / 1000
      )
      return {
        allowed: false,
        remaining: 0,
        resetAt: result.reset,
        response: NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(
                Math.ceil(result.reset / 1000)
              ),
            },
          }
        ),
      }
    }

    return {
      allowed: true,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  } catch (error) {
    // Se Upstash estiver fora, permite a request
    // (fail open — melhor que bloquear usuários legítimos)
    console.error('[RateLimit] Upstash error:', error)
    return { allowed: true, remaining: 999, resetAt: 0 }
  }
}
