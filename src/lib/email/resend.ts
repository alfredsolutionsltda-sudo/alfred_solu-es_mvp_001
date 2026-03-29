import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY não configurada — e-mails não serão enviados')
    return null
  }
  return new Resend(apiKey)
}

interface ContractSignedEmailData {
  contractTitle: string
  clientName: string
  clientDocument: string
  signedAt: string
  ip: string
  contractSlug: string
}

export async function sendContractSignedEmail(
  to: string,
  data: ContractSignedEmailData
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const contractUrl = `${appUrl}/contrato/${data.contractSlug}`

  const signedDate = new Date(data.signedAt).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1455ce 0%, #3b6fe8 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Alfred</h1>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0 0;">Gestão Inteligente para Profissionais</p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <!-- Ícone de sucesso -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; background-color: #dcfce7; border-radius: 50%; line-height: 56px; font-size: 28px;">
                  ✅
                </div>
              </div>
              
              <h2 style="color: #1a1c1b; font-size: 20px; font-weight: 800; text-align: center; margin: 0 0 8px 0;">
                Contrato Assinado!
              </h2>
              <p style="color: #737685; font-size: 14px; text-align: center; margin: 0 0 32px 0;">
                ${data.clientName} acabou de assinar o contrato.
              </p>
              
              <!-- Detalhes -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f2; border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e3e1;">
                          <span style="color: #737685; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Contrato</span><br>
                          <span style="color: #1a1c1b; font-size: 15px; font-weight: 600;">${data.contractTitle}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e3e1;">
                          <span style="color: #737685; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Assinado por</span><br>
                          <span style="color: #1a1c1b; font-size: 15px; font-weight: 600;">${data.clientName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e3e1;">
                          <span style="color: #737685; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Documento</span><br>
                          <span style="color: #1a1c1b; font-size: 15px; font-weight: 600;">${data.clientDocument}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e3e1;">
                          <span style="color: #737685; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Data/Hora</span><br>
                          <span style="color: #1a1c1b; font-size: 15px; font-weight: 600;">${signedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #737685; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">IP Registrado</span><br>
                          <span style="color: #1a1c1b; font-size: 15px; font-weight: 600;">${data.ip}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${contractUrl}" style="display: inline-block; background: linear-gradient(135deg, #1455ce 0%, #3b6fe8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px;">
                  Ver contrato assinado
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #f4f4f2; text-align: center;">
              <p style="color: #c3c6d6; font-size: 12px; margin: 0;">
                Este e-mail foi enviado automaticamente pelo Alfred.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const resendClient = getResendClient()
    if (!resendClient) {
      console.warn('Resend não configurado — e-mail não enviado')
      return { success: false, error: 'RESEND_API_KEY não configurada' }
    }

    const { data: emailData, error } = await resendClient.emails.send({
      from: 'Alfred <onboarding@resend.dev>',
      to: [to],
      subject: `✅ ${data.clientName} assinou o contrato`,
      html: htmlBody,
    })

    if (error) {
      console.error('Erro ao enviar e-mail Resend:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
    return { success: false, error: err }
  }
}
