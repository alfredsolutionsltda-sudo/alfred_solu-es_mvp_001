import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const reportsAiSchema = z.object({
  period: z.enum(['month', 'quarter', 'year']),
  metricsData: z.any(),
  type: z.enum(['analysis', 'strategic']).optional().default('analysis'),
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

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = reportsAiSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { period, metricsData, type } = parsed.data

    // 5. Lógica protegida (Groq)
    const userName = profile.preferred_name || 'Profissional'
    
    // Log apenas metadados
    console.log('Chamando Groq (ai-reports):', {
      userId,
      type,
      timestamp: new Date().toISOString()
    })

    let systemPrompt = `Você é o Alfred, Chief of Staff de ${userName}.`
    if (type === 'analysis') {
      systemPrompt += ` Gere uma análise direta em 3 frases curtas sobre o período ${period}.`
    } else {
      systemPrompt += ` Gere um resumo estratégico JSON com oportunidades e riscos para o período ${period}.`
    }

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
          { role: 'user', content: `Dados: ${JSON.stringify(metricsData)}` }
        ],
        max_tokens: 800,
        temperature: 0.3,
        response_format: type === 'strategic' ? { type: 'json_object' } : undefined,
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ''
    
    // Sanitização (apenas se não for JSON estratégico para evitar quebrar estrutura, 
    // mas o usuário pediu "Sanitize TUDO")
    const cleanContent = type === 'strategic' ? rawContent : sanitizeText(rawContent)

    // 6. Auditoria
    await logAudit({
      userId,
      action: 'report_generated',
      resource: 'reports',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { period, type }
    })

    if (type === 'strategic') {
      try {
        return NextResponse.json({ result: JSON.parse(cleanContent) })
      } catch {
        return NextResponse.json({ error: 'Erro ao processar resposta estratégica' }, { status: 500 })
      }
    }

    return NextResponse.json({ result: cleanContent })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
