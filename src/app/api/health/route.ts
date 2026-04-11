import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit'
import { logger } from '@/lib/logger'

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      auth: 'unknown',
    }
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing',
      { cookies: { get: (n) => cookieStore.get(n)?.value } }
    )
    await supabase.from('profiles').select('id').limit(1)
    checks.services.database = 'ok'
    checks.services.auth = 'ok'
  } catch {
    checks.status = 'degraded'
    checks.services.database = 'error'
  }

  const statusCode = checks.status === 'ok' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
