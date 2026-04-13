import { requireAuth } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logAudit } from '@/lib/audit'
import { fiscalCalculateSchema } from '@/lib/api/schemas'
import { compareRegimes } from '@/lib/fiscal/tax-calculator'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  const rl = await checkRateLimit(ip, 'fiscal-calculate')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação (Opcional se for público, mas o usuário pediu para proteger TODAS as API Routes)
  const { userId, error } = await requireAuth()
  if (error) return error

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = fiscalCalculateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { monthlyRevenue, annualRevenue, activityType } = parsed.data

    const results = compareRegimes(
      monthlyRevenue, 
      annualRevenue || monthlyRevenue * 12, 
      activityType
    )

    // 5. Auditoria
    await logAudit({
      userId: userId!,
      action: 'fiscal_calculation_performed',
      resource: 'fiscal',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { monthlyRevenue, activityType }
    })

    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
