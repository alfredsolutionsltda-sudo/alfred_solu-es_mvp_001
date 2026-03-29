import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { signContract, getContractBySlug } from '@/lib/data/contracts'
import { sendContractSignedEmail } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { slug, name, document } = await request.json()

    if (!slug || !name || !document) {
      return NextResponse.json(
        { error: 'Slug, nome e documento são obrigatórios' },
        { status: 400 }
      )
    }

    // Captura IP do cliente via headers
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '0.0.0.0'

    const signedAt = new Date().toISOString()

    // Assina o contrato
    const result = await signContract(slug, {
      name,
      document,
      ip,
      signed_at: signedAt,
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Erro ao assinar contrato. Verifique se o contrato está disponível para assinatura.' },
        { status: 400 }
      )
    }

    // Dispara e-mail de notificação para o profissional
    try {
      const contract = await getContractBySlug(slug)
      if (contract && contract.professional?.email) {
        await sendContractSignedEmail(contract.professional.email, {
          contractTitle: contract.title,
          clientName: name,
          clientDocument: document,
          signedAt,
          ip,
          contractSlug: slug,
        })
      }
    } catch (emailError) {
      // E-mail não deve bloquear a assinatura
      console.error('Erro ao enviar e-mail de notificação:', emailError)
    }

    return NextResponse.json({
      success: true,
      ip,
      signed_at: signedAt,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor'
    console.error('Erro na assinatura de contrato:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
