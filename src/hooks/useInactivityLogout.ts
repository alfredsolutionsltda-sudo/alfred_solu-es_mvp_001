import { useEffect, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useInactivityLogout(timeoutMinutes = 60) {
  const router = useRouter()
  const supabase = createClient()
  // Utilizando estado para guardar o timeout para não estourar em ambientes SSR
  const [active, setActive] = useState(true)

  const logout = useCallback(async () => {
    setActive(false)
    await supabase.auth.signOut()
    router.push('/login?reason=inactivity')
  }, [supabase, router])

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>
    
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(logout, timeoutMinutes * 60 * 1000)
    }
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [logout, timeoutMinutes, active])
}
