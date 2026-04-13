'use client'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { initPostHog, posthog } from '@/lib/posthog/client'

function PostHogTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()

  // Identifica o usuário logado
  useEffect(() => {
    if (user && profile) {
      posthog.identify(user.id, {
        email: user.email,
        name: profile.full_name,
        plan: profile.plan,
        profession: profile.profession,
        locale: profile.locale,
        onboarding_completed: profile.onboarding_completed,
      })
    }
  }, [user, profile])

  // Captura pageview em cada navegação
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Inicializa PostHog
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogTracking />
      </Suspense>
      {children}
    </>
  )
}
