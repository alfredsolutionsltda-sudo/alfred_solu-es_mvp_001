import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Redireciona para login com erro em caso de falha
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
