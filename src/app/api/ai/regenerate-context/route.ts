import { requireAuthWithProfile } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
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
  const rl = await checkRateLimit(ip, 'context-regenerate')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação
  const { userId, profile, error } = await requireAuthWithProfile()
  if (error) return error
  if (!userId || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // 4. Lógica protegida (Groq)
  try {
    // Log apenas metadados
    console.log('Chamando Groq (context-regenerate):', {
      userId,
      timestamp: new Date().toISOString()
    })

    const generatePrompt = `Gere um alfred_context (persona de IA) baseado nestes dados: ${JSON.stringify(profile)}.
    O texto deve ser em primeira pessoa, entre 300 e 500 palavras.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Você é um especialista em estruturação de personas para IA.' },
          { role: 'user', content: generatePrompt }
        ],
        max_tokens: 800, // Limite para análise
        temperature: 0.7
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const aiData = await response.json()
    const newContext = sanitizeText(aiData.choices[0].message.content)

    // 5. Salva no banco (usando adminClient para override RLS se necessário, ou supabase client normal se RLS permitir update)
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ alfred_context: newContext })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao salvar contexto' }, { status: 500 })
    }

    // 6. Auditoria
    await logAudit({
      userId,
      action: 'context_regenerated',
      resource: 'profiles',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, context: newContext })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
