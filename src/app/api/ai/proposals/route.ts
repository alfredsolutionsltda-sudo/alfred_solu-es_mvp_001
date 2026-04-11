import { requireAuthWithProfile } from '@/lib/api/auth'
import { createProposalSchema } from '@/lib/api/schemas'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const allowed = await checkRateLimit(ip, 'ai-proposals', RATE_LIMITS['ai-proposals'].limit, RATE_LIMITS['ai-proposals'].window)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento.' },
      { status: 429 }
    )
  }

  // 3. Autenticação e Perfil
  const { userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = createProposalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { clientName, serviceType, value, deliverables, timeline, paymentTerms } = parsed.data

    // 5. Preparação segura do prompt
    const alfredContext = profile.alfred_context || ''
    const professionalName = profile.preferred_name || 'Profissional'
    
    // Log apenas metadados
    console.log('Chamando Groq (ai-proposals):', {
      userId,
      timestamp: new Date().toISOString()
    })

    const systemPrompt = `Você é o Alfred, estrategista comercial.
    Gere uma proposta comercial para o profissional ${professionalName}.
    Contexto: ${alfredContext}
    Regras: Texto persuasivo, claro e profissional. Sem placeholders.
    Dados: Cliente ${clientName}, Serviço ${serviceType}, Valor R$ ${value}, Entregáveis: ${deliverables}.`

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
          { role: 'user', content: 'Gere a proposta comercial estruturada.' }
        ],
        max_tokens: 1500,
        temperature: 0.4
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''
    const cleanText = sanitizeText(rawText)

    // 6. Auditoria
    await logAudit({
      userId,
      action: 'proposal_generated',
      resource: 'proposals',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { clientName, serviceType }
    })

    return NextResponse.json({ proposalText: cleanText })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
