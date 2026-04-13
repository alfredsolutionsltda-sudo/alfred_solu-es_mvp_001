'use client'
import { useEffect } from 'react'
import { posthog } from '@/lib/posthog/client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Reporta o erro ao PostHog
    posthog.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_stack_trace_raw: error.stack,
      digest: error.digest,
    })

    if (process.env.NODE_ENV === 'production') {
      console.error('App error:', error.digest)
    }
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#F9F9F7',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: 16,
        padding: 40, maxWidth: 480, textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, 
          marginBottom: 8, color: '#0F1117' }}>
          Algo deu errado
        </h2>
        <p style={{ color: '#8A8A85', marginBottom: 24, 
          lineHeight: 1.6 }}>
          Tivemos um problema inesperado. Seus dados estão 
          seguros. Tente novamente.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#1455CE', color: 'white',
            border: 'none', borderRadius: 8, padding: '12px 24px',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            marginRight: 12,
          }}
        >
          Tentar novamente
        </button>
        <a href="/dashboard" style={{
          color: '#1455CE', fontSize: 14, textDecoration: 'none'
        }}>
          Voltar ao início
        </a>
      </div>
    </div>
  )
}
