import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createContract } from '@/lib/data/contracts'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      userId,
      clientName,
      clientId,
      clientEmail,
      serviceType,
      value,
      startDate,
      endDate,
      paymentTerms,
      contractBody,
      title,
      description,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const contract = await createContract(userId, {
      clientName,
      clientId,
      clientEmail,
      serviceType,
      value: Number(value),
      startDate,
      endDate,
      paymentTerms,
      contractBody,
      title,
      description,
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Erro ao criar contrato' },
        { status: 500 }
      )
    }

    return NextResponse.json({ contract })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor'
    console.error('Erro na API de contratos:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
