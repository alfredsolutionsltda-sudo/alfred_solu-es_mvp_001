function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function contractSignedTemplate(data: {
  contractTitle: string
  clientName: string
  signedAt: string
  ip: string
  contractUrl: string
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2>Contrato assinado</h2>
      <p><strong>${escapeHtml(data.clientName)}</strong> 
         assinou o contrato 
         <strong>${escapeHtml(data.contractTitle)}</strong></p>
      <p>Data: ${escapeHtml(data.signedAt)}</p>
      <p>IP registrado: ${escapeHtml(data.ip)}</p>
      <a href="${escapeHtml(data.contractUrl)}">Ver contrato</a>
    </div>
  `
}

export function genericNotificationTemplate(data: {
  title: string
  message: string
  buttonLabel?: string
  buttonUrl?: string
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2>${escapeHtml(data.title)}</h2>
      <p>${escapeHtml(data.message)}</p>
      ${data.buttonUrl ? `
        <a href="${escapeHtml(data.buttonUrl)}" 
           style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          ${escapeHtml(data.buttonLabel || 'Ver detalhes')}
        </a>
      ` : ''}
    </div>
  `
}
