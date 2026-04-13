import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logAudit } from '@/lib/audit'
import { createLinearIssue } from '@/lib/linear'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const feedbackSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
})

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting (Estrito: 5 por hora por IP)
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  const rl = await checkRateLimit(ip, 'feedback')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação
  const { session, userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
  }

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos. Título e descrição são obrigatórios.' }, { status: 400 })
    }

    const { title, description, type } = parsed.data

    // 5. Preparar descrição com contexto do usuário
    const enhancedDescription = `
**Tipo:** ${type.toUpperCase()}
**Enviado por:** ${profile.preferred_name || profile.full_name || 'Usuário'} (${session?.user?.email || 'E-mail não disponível'})
**User ID:** ${userId}

---

${description}
    `

    // 6. Criar issue no Linear
    await createLinearIssue({
      title: `[${type.toUpperCase()}] ${title}`,
      description: enhancedDescription,
      labelNames: [type]
    })

    // 7. Auditoria
    await logAudit({
      userId,
      action: 'feedback_submitted',
      resource: 'linear',
      metadata: { type, title },
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, message: 'Feedback enviado com sucesso! Obrigado por nos ajudar a melhorar o Alfred.' })

  } catch (err) {
    console.error('Erro ao enviar feedback para o Linear:', err)
    return NextResponse.json({ error: 'Erro ao processar seu feedback. Tente novamente mais tarde.' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
