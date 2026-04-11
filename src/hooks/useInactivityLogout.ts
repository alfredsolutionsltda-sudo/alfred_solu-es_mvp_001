import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { clearSensitiveData } from '@/lib/cleanup'

export function useInactivityLogout(
  timeoutMinutes = 60
) {
  const router = useRouter()
  const supabase = createClient()

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    clearSensitiveData()
    router.push('/login?reason=inactivity')
  }, [supabase, router])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(logout, timeoutMinutes * 60 * 1000)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handleEvent = () => resetTimer()

    events.forEach(e => window.addEventListener(e, handleEvent))
    resetTimer()

    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, handleEvent))
    }
  }, [logout, timeoutMinutes])
}
