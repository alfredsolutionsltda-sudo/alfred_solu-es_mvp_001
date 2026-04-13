import { requireAuthWithProfile } from '@/lib/api/auth'
import { createContractSchema } from '@/lib/api/schemas'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
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
  const rl = await checkRateLimit(ip, 'ai-generate')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação e Perfil
  const { userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // 4. Validação do body
  try {
    const body = await request.json()
    const parsed = createContractSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      clientName,
      serviceType,
      value,
      description,
      startDate,
      endDate,
      paymentTerms
    } = parsed.data

    // 5. Preparação segura do prompt (sem logar dados sensíveis)
    const alfredContext = profile.alfred_context || ''
    const professionalName = profile.preferred_name || 'Profissional'
    
    // Log apenas metadados
    console.log('Chamando Groq (ai-contracts):', {
      userId,
      timestamp: new Date().toISOString()
    })

    const systemPrompt = `Você é o Alfred, assistente jurídico. 
    Gere um contrato para o profissional ${professionalName}.
    Contexto: ${alfredContext}
    Regras: Texto puro, sem markdown, sem placeholders.
    Dados: Cliente ${clientName}, Serviço ${serviceType}, Valor ${value}.`

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
          { role: 'user', content: 'Gere o contrato agora.' }
        ],
        max_tokens: 1500, // Limite solicitado
        temperature: 0.3
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''
    
    // 6. Sanitização
    const cleanText = sanitizeText(rawText)

    // 7. Auditoria
    await logAudit({
      userId,
      action: 'contract_generated',
      resource: 'contracts',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { clientName, serviceType }
    })

    return NextResponse.json({ contractText: cleanText })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
