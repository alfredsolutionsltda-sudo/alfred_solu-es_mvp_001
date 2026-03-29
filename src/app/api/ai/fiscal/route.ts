import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFiscalMetrics } from '@/lib/data/fiscal';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const fiscalSchema = z.object({
  userId: z.string().uuid(),
  question: z.string().optional(),
  context: z.any().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimit(ip, 20)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const result = fiscalSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 });
    }

    const { userId, question } = result.data;

    const supabase = await createClient();
    
    // 1. Busca perfil e contexto — Otimizado select
    const { data: profile } = await supabase
      .from('profiles')
      .select('alfred_context, tax_regime, average_ticket, preferred_name, full_name')
      .eq('id', userId)
      .single();

    // 2. Busca métricas fiscais atuais para dar contexto à IA
    const metrics = await getFiscalMetrics(userId);

    console.log('AI Fiscal Request:', { userId, question: question?.substring(0, 50) });

    const alfredContext = profile?.alfred_context || '';
    const taxRegime = profile?.tax_regime || 'Não definido';
    const averageTicket = profile?.average_ticket || 0;

    const systemPrompt = `Você é o Alfred, consultor fiscal do profissional ${profile?.preferred_name || 'Usuário'}.
    Contexto do profissional: ${alfredContext}
    Regime atual: ${taxRegime}
    Faturamento mensal médio: R$ ${averageTicket}
    
    Dados fiscais atuais:
    - Próxima obrigação: ${metrics.nextObligation.name} em ${metrics.nextObligation.daysRemaining} dias.
    - Total pago no ano: R$ ${metrics.totalPaidYear.value}
    - Projeção anual de impostos: R$ ${metrics.annualProjection.estimatedTotal}
    
    INSTRUÇÕES:
    - Responda em linguagem simples, sem jargão técnico (contês).
    - Seja direto e prático — o profissional precisa entender o que fazer, não estudar contabilidade.
    - Se houver uma oportunidade de economia (ex: migrar de regime), mencione.
    - Máximo 3 parágrafos.
    - Use português do Brasil.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROQ API key is missing' }, { status: 500 });
    }

    console.log('Fetching Groq AI completion for fiscal...');
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
          { role: 'user', content: question || "Analise minha situação fiscal atual e me dê um feedback rápido." }
        ],
        max_tokens: 512,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq AI Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ answer: data.choices[0].message.content });

  } catch (error: any) {
    console.error('Unexpected error in fiscal AI route:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
