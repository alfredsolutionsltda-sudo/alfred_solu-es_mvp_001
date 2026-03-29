import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { contractId, slug, clientEmail, clientName, title } = await request.json()

    if (!slug || !clientEmail) {
      return NextResponse.json(
        { error: 'Slug e e-mail do cliente são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica autenticação
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca perfil do profissional para personalizar o e-mail
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', user.id)
      .single()

    const professionalName = profile?.full_name || 'Seu Profissional'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const contractUrl = `${appUrl}/contrato/${slug}`

    // Envia o e-mail via Resend
    const { data, error } = await resend.emails.send({
      from: 'Alfred <onboarding@resend.dev>', // Em produção, usar domínio verificado
      to: clientEmail,
      subject: `Proposta de Serviço: ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #1455ce; color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">Proposta de Serviço</h1>
            <p style="margin: 10px 0 0; opacity: 0.8;">Enviada por ${professionalName}</p>
          </div>
          
          <p>Olá, <strong>${clientName || 'Cliente'}</strong>,</p>
          
          <p>Você recebeu uma nova proposta de serviço: <strong>${title}</strong>.</p>
          
          <p>Para visualizar os detalhes e realizar a assinatura digital, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${contractUrl}" style="background-color: #1455ce; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
              Visualizar e Assinar Contrato
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <a href="${contractUrl}" style="color: #1455ce;">${contractUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Enviado via <strong>Alfred</strong> — Seu assistente pessoal de gestão profissional.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Erro Resend:', error)
      // Se for um erro conhecido do Resend, retorna a mensagem detalhada
      const errorMsg = (error as any).message || 'Erro desconhecido no Resend'
      const errorName = (error as any).name || 'ResendError'
      return NextResponse.json({ error: `Falha no Resend (${errorName}): ${errorMsg}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    console.error('Erro na API de envio de contrato:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
