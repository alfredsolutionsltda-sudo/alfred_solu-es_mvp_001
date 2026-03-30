'use client'

import { useEffect, useRef } from 'react'
import { incrementReadingTimeAction } from '@/app/actions/contractActions'

interface ReadingTrackProps {
  slug: string
}

export default function ReadingTrack({ slug }: ReadingTrackProps) {
  const lastTracked = useRef<number>(Date.now())
  const interval = 30 // segundos

  useEffect(() => {
    // Marca a primeira leitura imediatamente se necessário (o RPC já faz o COALESCE no read_at)
    incrementReadingTimeAction(slug, 0)

    const timer = setInterval(() => {
      // Apenas rastreia se a aba estiver visível
      if (document.visibilityState === 'visible') {
        incrementReadingTimeAction(slug, interval)
        lastTracked.current = Date.now()
      }
    }, interval * 1000)

    return () => clearInterval(timer)
  }, [slug])

  return null // Componente invisível
}
