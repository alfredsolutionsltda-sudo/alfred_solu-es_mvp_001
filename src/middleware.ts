import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/cadastro', 
  '/auth/callback',
  '/auth/whop-callback',
  '/acesso-negado',
]

const PUBLIC_PREFIXES = [
  '/contrato/',
  '/proposta/',
  '/_next/',
  '/images/',
  '/favicon',
  '/api/webhooks/',        // webhooks são públicos
  '/api/proposals/open',
  '/api/proposals/accept',
  '/api/proposals/refuse',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permite rotas e prefixos públicos
  if (PUBLIC_ROUTES.some(r => pathname === r)) {
    return NextResponse.next()
  }
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verifica sessão
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Sem sessão → login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verifica autorização (plano ativo)
  if (!pathname.startsWith('/onboarding') && 
      !pathname.startsWith('/acesso-negado') &&
      !pathname.startsWith('/api/')) {
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_authorized, plan, onboarding_completed')
      .eq('id', session.user.id)
      .single()

    // Sem plano → acesso negado
    if (!profile?.is_authorized || !profile?.plan) {
      return NextResponse.redirect(
        new URL('/acesso-negado', request.url)
      )
    }

    // Com plano mas sem onboarding → onboarding
    if (!profile?.onboarding_completed && 
        !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(
        new URL('/onboarding', request.url)
      )
    }

    // Onboarding completo tentando acessar /onboarding → dashboard
    if (profile?.onboarding_completed && 
        pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(
        new URL('/dashboard', request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ],
}
