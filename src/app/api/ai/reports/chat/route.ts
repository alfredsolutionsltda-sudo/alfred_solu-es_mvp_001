import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const reportsChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(2000)
  })),
  metricsData: z.any().optional(),
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
  const rl = await checkRateLimit(ip, 'ai-chat')
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
    const parsed = reportsChatSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { messages, metricsData } = parsed.data

    // 5. Lógica protegida (Groq)
    const name = profile.preferred_name || 'Profissional'
    
    // Log apenas metadados
    console.log('Chamando Groq (ai-reports-chat):', {
      userId,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    })

    const systemPrompt = `Você é o Alfred, Chief of Staff de ${name}.
    Contexto: ${profile.alfred_context || ''}
    Sessão de chat estratégico sobre relatórios.
    Dados reais: ${JSON.stringify(metricsData || {})}
    Regras: Responda sobre os números, Máximo 2-3 frases.`

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
          ...messages
        ],
        max_tokens: 500, // Limite para chat
        temperature: 0.7
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const rawMessage = data.choices?.[0]?.message?.content || ''
    const cleanMessage = sanitizeText(rawMessage)

    // 6. Auditoria (Opcional para chat, mas bom para debug de uso)
    await logAudit({
      userId,
      action: 'report_chat_message',
      resource: 'reports',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ message: cleanMessage })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
