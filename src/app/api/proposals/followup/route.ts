import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const followupSchema = z.object({
  proposalId: z.string().uuid(),
  clientName: z.string().min(2),
  lastContactDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const allowed = await checkRateLimit(ip, 'proposals-followup', 10, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  // 3. Autenticação
  const { userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // 4. Lógica protegida (Groq)
  try {
    const body = await request.json()
    const parsed = followupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { clientName, proposalId } = parsed.data
    
    // Log apenas metadados
    console.log('Chamando Groq (proposals-followup):', {
      userId,
      proposalId,
      timestamp: new Date().toISOString()
    })

    const systemPrompt = `Você é o Alfred, assistente comercial.
    Gere uma mensagem de acompanhamento (follow-up) educada e profissional para o cliente ${clientName}.
    Contexto do mestre: ${profile.alfred_context || ''}
    Regras: Curta, gentil e direta. Máximo 3 frases.`

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
          { role: 'user', content: `Gere a mensagem de follow-up para a proposta ${proposalId}.` }
        ],
        max_tokens: 300,
        temperature: 0.5
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''
    const cleanText = sanitizeText(rawText)

    // 5. Auditoria
    await logAudit({
      userId,
      action: 'proposal_followup_generated',
      resource: 'proposals',
      resourceId: proposalId,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ followupText: cleanText })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
