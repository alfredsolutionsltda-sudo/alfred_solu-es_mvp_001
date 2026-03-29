import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardMetrics, getContractsWidget } from '@/lib/data/dashboard';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimit(ip, 20)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const result = chatSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 });
    }

    const { message, history } = result.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca contexto real do usuário — Otimizado select
    const [profile, metrics, contractsData] = await Promise.all([
      supabase.from('profiles').select('full_name, alfred_context').eq('id', user.id).single(),
      getDashboardMetrics(user.id, 'mes'),
      getContractsWidget(user.id, 'mes')
    ]);

    const alfredContext = profile.data?.alfred_context || '';
    const profName = profile.data?.full_name || 'Profissional';
    
    // Constrói um resumo do negócio para a IA
    const businessSummary = `
      - Contratos Ativos: ${metrics.activeContracts}
      - Clientes Ativos: ${metrics.clientesAtivos}
      - Faturamento Mensal: R$ ${metrics.faturamentoPeriodo.toLocaleString('pt-BR')}
      - Contratos Recentes: ${contractsData.latestContracts.map(c => c.title).join(', ') || 'Nenhum'}
      - Inadimplência Atual: R$ ${metrics.inadimplenciaTotal.toLocaleString('pt-BR')}
    `;

    const systemPrompt = `Você é o Alfred, assistente pessoal e estratégico de alto nível de ${profName}.
Contexto do seu mestre: ${alfredContext}

DADOS ATUAIS DO NEGÓCIO:
${businessSummary}

Sua missão é ajudar ${profName} a gerir o negócio dele da forma mais eficiente possível.
Você tem acesso total aos dados acima para responder perguntas estratégicas.

REGRAS:
- Seja extremamente executivo, direto e útil.
- Responda em Português do Brasil.
- Se solicitado para analisar algo, use os DADOS ATUAIS fornecidos acima.
- Se não souber algo, admita, mas tente sugerir uma ação prática baseada nos dados.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY is missing');
      return NextResponse.json({ reply: 'Desculpe, meu módulo de inteligência está offline no momento.' });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      return NextResponse.json({ reply: 'Tive um problema ao processar sua resposta. Pode tentar novamente?' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Empty reply from Groq:', data);
      return NextResponse.json({ reply: 'Não consegui formular uma resposta agora. Vamos tentar de outra forma?' });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat Route Error:', error);
    return NextResponse.json({ reply: 'Erro interno ao falar com o Alfred. Verifique sua conexão.' });
  }
}

