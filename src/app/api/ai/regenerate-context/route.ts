import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca profile completo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const generatePrompt = `Com base nas informações abaixo sobre o profissional, gere um alfred_context em texto corrido e estruturado que será usado como system prompt em todas as futuras interações. Inclua: nome preferido, profissão e especialidade, registro profissional, dados fiscais (documento, regime, estado), serviços e valores, perfil de clientes, tom de contratos e cláusulas especiais.

O texto deve ser escrito em primeira pessoa como se o Alfred já conhecesse profundamente o profissional. Seja específico — nunca use placeholders.
O alfred_context gerado deve ter entre 300 e 500 palavras.

Dados coletados:
${JSON.stringify(profile, null, 2)}`

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente' }, { status: 500 })
    }

    // Chama Groq para regenerar o contexto
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em estruturação de personas para IA. Gere o alfred_context conforme solicitado.' 
          },
          { role: 'user', content: generatePrompt }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      })
    })

    if (!response.ok) {
      throw new Error('Falha na resposta da Groq')
    }

    const aiData = await response.json()
    const newContext = aiData.choices[0].message.content

    // Salva o novo contexto no Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ alfred_context: newContext, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, context: newContext })

  } catch (error: any) {
    console.error('Erro na regeneração de contexto:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
