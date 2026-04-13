import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!await await validateOrigin()) {
    console.error('CSRF Validation failed for origin:', request.headers.get('origin'));
    return new Response(JSON.stringify({ error: 'Origem não permitida' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const body = await request.json();
    const { messages, systemPrompt, userId } = body;

    console.log('AI API Request received:', { userId, systemPrompt: systemPrompt?.substring(0, 100) + '...', messagesCount: messages?.length });

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Busca o profile do usuário no Supabase pelo userId
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('alfred_context')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Se alfred_context existir, usa ele. Se não, usa o systemPrompt recebido.
    const activeSystemPrompt = profile?.alfred_context || systemPrompt || "Você é o Alfred, assistente digital e estrategista de alto nível.";

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROQ API key is missing' }, { status: 500 });
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
          { role: 'system', content: activeSystemPrompt },
          ...messages
        ],
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData
      });
      return NextResponse.json({ 
        error: 'Failed to fetch response from AI model',
        details: errorData 
      }, { status: response.status || 500 });
    }

    const data = await response.json();
    console.log('Groq API Response success:', { model: data.model, usage: data.usage });
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Unexpected error in AI route:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json({ 
      error: 'Internal Server Error in AI Route',
      message: error?.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}


export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
