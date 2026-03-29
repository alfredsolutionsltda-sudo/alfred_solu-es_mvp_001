import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, metricsData } = await req.json();
    const userId = session.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('alfred_context, preferred_name')
      .eq('id', userId)
      .single();

    const alfredContext = profile?.alfred_context || '';
    const name = profile?.preferred_name || 'Usuário';

    const systemPrompt = `Você é o Alfred, Chief of Staff de ${name}.
Contexto: ${alfredContext}

Você está em uma sessão de chat estratégico analizando os relatórios do negócio.
Abaixo estão os dados reais do período para sua consulta:
${JSON.stringify(metricsData)}

Responda perguntas sobre os números, simule cenários e sugira ações baseadas nos dados reais.
Seja direto, profissional e inspirador. Máximo de 2-3 frases por resposta.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API Key missing' }, { status: 500 });
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
          ...messages
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
       const errorData = await response.text();
       console.error('[Alfred Chat] API Error:', response.status, errorData);
       return NextResponse.json({ error: 'AI provider error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      message: data.choices?.[0]?.message?.content || 'Não consegui processar sua mensagem agora.' 
    });

  } catch (error) {
    console.error('Error in strategic chat:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
