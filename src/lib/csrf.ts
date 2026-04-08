export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].filter(Boolean)

  if (!origin) return true
  
  // Verifica se é um domínio oficial, local ou da Vercel
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || 
    origin === allowed?.replace(/\/$/, '')
  )

  if (isAllowed) return true

  // Permite automaticamente domínios da Vercel para facilitar ambientes de preview
  if (origin.endsWith('.vercel.app')) return true

  console.warn(`[CSRF] Bloqueando origem não permitida: ${origin}`)
  return false
}
