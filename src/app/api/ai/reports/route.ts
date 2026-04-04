import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const reportsSchema = z.object({
  period: z.enum(['month', 'quarter', 'year']),
  metricsData: z.any(),
  type: z.enum(['analysis', 'strategic']).optional().default('analysis'),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimit(ip, 20)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = reportsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 });
    }

    const { period, metricsData, type } = result.data;
    const userId = session.user.id;

    // Busca o contexto do Alfred
    const { data: profile } = await supabase
      .from('profiles')
      .select('alfred_context, full_name, preferred_name')
      .eq('id', userId)
      .single();

    const userName = profile?.preferred_name || profile?.full_name || 'Usuário';
    const alfredContext = profile?.alfred_context || 'Sem contexto adicional.';

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'analysis') {
      systemPrompt = `Você é o Alfred, Chief of Staff de ${userName}. 
Contexto: ${alfredContext}

Com base nos dados do período (${period}) abaixo, gere uma análise estratégica extremamente resumida e certeira com:
1. Um diagnóstico direto em 1 frase curta
2. A principal oportunidade (1 frase)
3. O principal risco (1 frase)

Seja direto, ignore introduções. Use números reais. Máximo 3 frases curtas no total.`;

      userPrompt = `Dados do período: ${JSON.stringify(metricsData)}`;
    } else if (type === 'strategic') {
      systemPrompt = `Você é o Alfred, Chief of Staff de ${userName}.
Contexto: ${alfredContext}

Com base nos dados abaixo, liste:
- 2 oportunidades concretas de crescimento (com valores estimados baseados nos dados)
- 1-2 riscos específicos (com impacto estimado em R$)
- 3 parágrafos curtos para o Resumo Executivo (Saúde Financeira, Performance Comercial, Sustentabilidade)

Seja direto e use os números reais. 
IMPORTANTE: Retorne obrigatoriamente um objeto JSON válido.
Formato:
{
  "opportunities": [{"title": "string", "description": "string", "action": "string"}],
  "risks": [{"title": "string", "description": "string", "impact": "string"}],
  "executiveSummary": {
    "financial": "string",
    "commercial": "string",
    "sustainability": "string"
  }
}`;
      userPrompt = `Dados para análise estratégica: ${JSON.stringify(metricsData)}`;
    }

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        response_format: type === 'strategic' ? { type: 'json_object' } : undefined,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Alfred API] Groq Error:', response.status, errorData);
      return NextResponse.json({ error: 'AI provider error', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    console.log(`[Alfred API] Type: ${type}, Content Length: ${content?.length || 0}`);

    if (type === 'strategic') {
      try {
        // Sanitização básica caso a IA retorne markdown
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent || '{}');
        return NextResponse.json({ result: parsed });
      } catch (parseError) {
        console.error('[Alfred API] JSON Parse Error:', parseError, content);
        return NextResponse.json({ error: 'Invalid JSON from AI', raw: content }, { status: 500 });
      }
    }

    return NextResponse.json({ result: content });

  } catch (error: any) {
    console.error('Error in Alfred analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to generate analysis',
      details: 'Erro interno. Tente novamente.' 
    }, { status: 500 });
  }
}


export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
