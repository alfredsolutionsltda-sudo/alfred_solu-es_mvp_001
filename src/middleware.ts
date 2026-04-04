import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Definir rotas públicas
  const publicRoutes = ['/login', '/cadastro', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route)) ||
                        path.startsWith('/contrato/') ||
                        path.startsWith('/proposta/') ||
                        path.startsWith('/api/proposals/')

  // Sem sessão -> redirect para /login se não for rota pública
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Com sessão
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const hasOnboarding = profile?.onboarding_completed

    // Se está em rota de login/cadastro, manda pro dashboard
    if (path.startsWith('/login') || path.startsWith('/cadastro')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Com sessão mas sem onboarding -> redirect para /onboarding
    if (!hasOnboarding && !path.startsWith('/onboarding') && !isPublicRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Com onboarding completo tentando acessar /onboarding -> redirect para /dashboard
    if (hasOnboarding && path.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
