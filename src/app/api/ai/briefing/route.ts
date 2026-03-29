import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { briefingData, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!briefingData) {
      return NextResponse.json({ error: 'Briefing data is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('alfred_context, full_name')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const userName = profile?.full_name || 'usuário'
    const context = profile?.alfred_context || ''

    const systemPrompt = `Você é o Alfred, Chief of Staff estratégico e braço direito de ${userName}. 
Sua personalidade e tom de voz devem ser condizentes com o perfil do seu mestre: ${context}.

Com base nos dados de negócio (clientes, contratos, faturas) fornecidos abaixo, gere um briefing diário conciso com no máximo 4 itens prioritários de ação. 
Para cada item, seja extremamente específico (use nomes reais, valores reais, datas reais). 
Seu objetivo é dar clareza e direção para ${userName} começar o dia.

REGRAS:
- Tom executivo, direto e profissional.
- Retorne apenas a lista de itens prioritários (com marcadores como 1. ou -).
- Se houver riscos financeiros ou contratos vencendo, priorize-os.`

    const userMessage = `Dados Atuais do Negócio: ${JSON.stringify(briefingData)}`

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROQ API key is missing' }, { status: 500 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1024,
        temperature: 0.5,
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API Error:', errorData)
      return NextResponse.json({ error: 'Failed to fetch response from AI model' }, { status: 500 })
    }

    const data = await response.json()
    const briefingText = data.choices[0]?.message?.content || ''

    return NextResponse.json({ briefing: briefingText })

  } catch (error: any) {
    console.error('Unexpected error in AI briefing route:', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}
