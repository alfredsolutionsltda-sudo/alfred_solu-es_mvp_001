import { headers } from 'next/headers'

export async function validateOrigin(): Promise<boolean> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://alfred-platform.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean)

  if (origin && !allowedOrigins.includes(origin)) {
    return false
  }
  
  return true
}
