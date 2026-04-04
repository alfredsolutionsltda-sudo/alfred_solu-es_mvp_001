import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/api/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

import { z } from 'zod'

const contractAiSchema = z.object({
  userId: z.string().uuid(),
  description: z.string().optional(),
  clientName: z.string().min(2),
  serviceType: z.string().min(2),
  value: z.union([z.number(), z.string()]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentTerms: z.string().optional(),
})

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origem não permitida' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  if (!rateLimit(ip, 10)) { // Limite mais estrito para contratos (mais pesado)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const result = contractAiSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 })
    }

    const {
      userId,
      description,
      clientName,
      serviceType,
      value,
      startDate,
      endDate,
      paymentTerms,
    } = result.data

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!clientName || !serviceType || !value) {
      return NextResponse.json(
        { error: 'Nome do cliente, tipo de serviço e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca o profile completo do usuário
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, company_name, cnpj, phone, alfred_context')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      )
    }

    const alfredContext = profile.alfred_context || ''
    const profissionalNome = profile.full_name || profile.email
    const profissionalEmpresa = profile.company_name || ''
    const profissionalCnpj = profile.cnpj || ''
    const profissionalPhone = profile.phone || ''

    // Formata o valor
    const valorFormatado = Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

    // Formata datas
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    const systemPrompt = `Você é o Alfred, assistente jurídico do profissional ${profissionalNome}.
Contexto completo sobre este profissional: ${alfredContext}

Gere um contrato de prestação de serviços COMPLETO em texto puro.

REGRAS ABSOLUTAS:
- Nunca use markdown (sem asteriscos, sem #, sem negrito, sem itálico)
- Nunca use placeholders [colchetes] — use os dados reais fornecidos
- O contrato deve ter: qualificação das partes, objeto, valor, forma de pagamento, prazo, obrigações de ambas as partes, confidencialidade, rescisão e foro
- Use linguagem formal e juridicamente válida
- O texto deve estar pronto para assinar — sem lacunas
- Não inclua cabeçalhos com formatação — use texto simples com separadores como linhas em branco
- Use letras maiúsculas apenas para títulos de cláusulas (ex: CLAUSULA PRIMEIRA - DO OBJETO)

DADOS DO CONTRATO:

Contratante (profissional):
- Nome: ${profissionalNome}
- Empresa: ${profissionalEmpresa}
- CNPJ: ${profissionalCnpj}
- Telefone: ${profissionalPhone}
- E-mail: ${profile.email}

Contratado (cliente):
- Nome: ${clientName}

Serviço: ${serviceType}
Descrição adicional: ${description || 'Não especificada'}
Valor: ${valorFormatado}
Forma de pagamento: ${paymentTerms || 'A combinar'}
Data de início: ${formatDate(startDate || '')}
Data de vencimento: ${formatDate(endDate || '')}

Gere o contrato completo agora.`

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Chave da API Groq não configurada' },
        { status: 500 }
      )
    }

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
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content:
                'Gere o contrato de prestação de serviços completo com base nos dados fornecidos.',
            },
          ],
          max_tokens: 4096,
          temperature: 0.3,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erro detalhado Groq API:', errorData)
      try {
        const errorJson = JSON.parse(errorData)
        return NextResponse.json(
          { error: `Erro na IA: ${errorJson.error?.message || 'Falha na geração'}` },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { error: 'Falha ao conectar com o serviço de IA' },
          { status: 500 }
        )
      }
    }

    const data = await response.json()
    const contractText =
      data.choices?.[0]?.message?.content || 'Erro ao gerar texto do contrato'

    // Limpeza mínima apenas para garantir legibilidade sem quebrar a estrutura
    const cleanText = contractText
      .replace(/```[\s\S]*?```/g, '') // Remove blocos de código se houver
      .replace(/`/g, '')             // Remove backticks isolados
      .replace(/\*\*/g, '')          // Remove negritos excessivos se o modelo ignorar a regra

    return NextResponse.json({ contractText: cleanText })
  } catch (error: unknown) {
    const message = error instanceof Error ? 'Erro interno. Tente novamente.' : 'Erro interno do servidor'
    console.error('Erro na rota de contratos:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
