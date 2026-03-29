import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const clientAiSchema = z.object({
  clientData: z.object({
    name: z.string(),
    type: z.string(),
    cpf_cnpj: z.string().optional().nullable(),
    status: z.string(),
    inadimplency_score: z.number().optional().default(0),
    active_contracts: z.number().optional().default(0),
    total_billed: z.number().optional().default(0),
    total_pending: z.number().optional().default(0),
  }),
  message: z.string().optional(),
  isInitial: z.boolean().optional().default(false),
  history: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimit(ip, 20)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const result = clientAiSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 });
    }

    const { clientData, message, isInitial, history } = result.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, company_name, alfred_context')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      );
    }

    const alfredContext = profile.alfred_context || '';
    const profName = profile.full_name || 'Profissional';

    const billed = typeof clientData.total_billed === 'number' ? clientData.total_billed : 0;
    const pending = typeof clientData.total_pending === 'number' ? clientData.total_pending : 0;

    const systemPrompt = `Você é o Alfred, assistente inteligente focado em análise de CRM e sucesso do cliente do profissional ${profName}.
Contexto sobre quem você está ajudando (${profName}): ${alfredContext}

Abaixo estão os dados do cliente que você deve analisar agora:
Nome: ${clientData.name}
Tipo: ${clientData.type}
Documento: ${clientData.cpf_cnpj || 'N/A'}
Status: ${clientData.status}
Score de Inadimplência: ${clientData.inadimplency_score}/100
Contratos Ativos: ${clientData.active_contracts}
Total Faturado: R$ ${billed.toFixed(2)}
Pendentes: R$ ${pending.toFixed(2)}

${isInitial ? 'Gere uma análise estratégica concisa de 2-3 linhas identificando o maior ponto de atenção (risco ou oportunidade) deste cliente, levando em conta o perfil do seu mestre (' + profName + ').' : 'Responda as dúvidas do profissional de forma analítica e estratégica sobre este cliente, mantendo o tom condizente com as preferências do perfil (' + alfredContext + ').'}

REGRAS ABSOLUTAS:
- Seja muito direto, executivo e profissional.
- Sugira ações práticas baseadas nos dados do cliente e no contexto do seu mestre.
- Use os valores financeiros para embasar suas sugestões.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY não encontrada');
      return NextResponse.json(
        { error: 'Chave da API Groq não configurada' },
        { status: 500 }
      );
    }

    let messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (!isInitial && history) {
      messages = messages.concat(history);
    }

    messages.push({ role: 'user', content: message || '' });

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          max_tokens: 1024,
          temperature: 0.5,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Groq API:', errorText);
      return NextResponse.json(
        { error: 'Falha na comunicação com Alfred: ' + response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    
    if (!reply) {
       return NextResponse.json({ error: 'Alfred não conseguiu formular uma resposta agora.' }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('Erro AI Clientes (POST):', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

