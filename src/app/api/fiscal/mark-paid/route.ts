import { requireAuth } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logAudit } from '@/lib/audit'
import { markObrigacaoAsPaid } from '@/lib/data/fiscal'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const markPaidSchema = z.object({
  obrigacaoId: z.string().uuid(),
  paidAt: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const allowed = await checkRateLimit(ip, 'fiscal-mark-paid', 20, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  // 3. Autenticação
  const { userId, error } = await requireAuth()
  if (error) return error

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = markPaidSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { obrigacaoId, paidAt } = parsed.data
    const updated = await markObrigacaoAsPaid(userId!, obrigacaoId, paidAt ? new Date(paidAt) : undefined)

    // 5. Auditoria
    await logAudit({
      userId: userId!,
      action: 'fiscal_obligation_paid',
      resource: 'fiscal',
      resourceId: obrigacaoId,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
