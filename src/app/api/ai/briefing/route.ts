import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const briefingAiSchema = z.object({
  briefingData: z.any(),
})

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  const rl = await checkRateLimit(ip, 'ai-generate')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação
  const { userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // 4. Lógica protegida (Groq)
  try {
    const body = await request.json()
    const parsed = briefingAiSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { briefingData } = parsed.data
    const userName = profile.preferred_name || profile.full_name || 'Profissional'
    
    // Log apenas metadados
    console.log('Chamando Groq (ai-briefing):', {
      userId,
      timestamp: new Date().toISOString()
    })

    const systemPrompt = `Você é o Alfred, Chief of Staff de ${userName}.
    Contexto: ${profile.alfred_context || ''}
    Gere um briefing diário conciso com 4 itens prioritários.
    Regras: Use nomes, valores e datas reais. Tom executivo.`

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
          { role: 'user', content: `Dados Atuais: ${JSON.stringify(briefingData)}` }
        ],
        max_tokens: 800, // Limite para briefing
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
      action: 'briefing_generated',
      resource: 'briefing',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ briefing: cleanText })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
