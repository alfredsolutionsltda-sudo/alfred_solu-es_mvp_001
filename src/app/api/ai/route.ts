import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
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
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Se alfred_context existir, usa ele. Se não, usa o systemPrompt recebido.
    const activeSystemPrompt = profile?.alfred_context || systemPrompt || "You are Alfred, a helpful AI assistant.";

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
      console.error('Groq API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch response from AI model' }, { status: 500 });
    }

    const data = await response.json();
    console.log('Groq API Response success:', { model: data.model, usage: data.usage });
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Unexpected error in AI route:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
