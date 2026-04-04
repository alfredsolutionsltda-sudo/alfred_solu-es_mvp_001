export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean)

  if (!origin) return true
  
  return allowedOrigins.some(allowed => 
    origin === allowed || 
    origin === allowed?.replace(/\/$/, '')
  )
}
