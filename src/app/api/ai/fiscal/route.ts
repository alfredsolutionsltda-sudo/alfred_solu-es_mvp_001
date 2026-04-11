import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { getFiscalMetrics } from '@/lib/data/fiscal'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const fiscalAiSchema = z.object({
  question: z.string().max(1000).trim().optional(),
})

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const allowed = await checkRateLimit(ip, 'ai-fiscal', RATE_LIMITS['ai-fiscal'].limit, RATE_LIMITS['ai-fiscal'].window)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento.' },
      { status: 429 }
    )
  }

  // 3. Autenticação
  const { userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = fiscalAiSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { question } = parsed.data

    // 5. Lógica protegida (Groq)
    const metrics = await getFiscalMetrics(userId)
    
    // Log apenas metadados
    console.log('Chamando Groq (ai-fiscal):', {
      userId,
      timestamp: new Date().toISOString()
    })

    const systemPrompt = `Você é o Alfred, consultor fiscal.
    Usuário: ${profile.preferred_name || 'Profissional'}.
    Regime: ${profile.tax_regime || 'Não definido'}.
    Métricas: Próxima obrigação ${metrics.nextObligation.name} em ${metrics.nextObligation.daysRemaining} dias.
    Total pago no ano: R$ ${metrics.totalPaidYear.value}.
    Instruções: Responda de forma prática e sem jargões.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question || "Dê um feedback rápido da minha situação." }
        ],
        max_tokens: 800, // Limite para briefing/análise
        temperature: 0.3
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const rawAnswer = data.choices?.[0]?.message?.content || ''
    const cleanAnswer = sanitizeText(rawAnswer)

    // 6. Auditoria
    await logAudit({
      userId,
      action: 'fiscal_analysis_generated',
      resource: 'fiscal',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ answer: cleanAnswer })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
