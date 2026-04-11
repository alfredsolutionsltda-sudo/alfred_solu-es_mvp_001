import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return {
      session: null,
      userId: null,
      error: NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
  }

  return { session, userId: session.user.id, error: null }
}

export async function requireAuthWithProfile() {
  const { session, userId, error } = await requireAuth()
  if (error || !userId) return { session: null, userId: null, profile: null, error }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, alfred_context, contract_tone, preferred_name, full_name, tax_regime')
    .eq('id', userId)
    .single()

  if (!profile) {
    return {
      session: null,
      userId: null,
      profile: null,
      error: NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }
  }

  return { session, userId, profile, error: null }
}
