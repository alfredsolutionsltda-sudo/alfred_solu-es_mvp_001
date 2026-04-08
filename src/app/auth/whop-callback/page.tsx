'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function WhopCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [plan, setPlan] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    const planParam = searchParams.get('plan') || ''
    setPlan(planParam)
    
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Já está logado — vai para o dashboard
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        // Não está logado — vai para o cadastro
        setStatus('success')
        setTimeout(() => {
          router.push(`/cadastro?from=whop&plan=${planParam}`)
        }, 2000)
      }
    }
    
    checkSession()
  }, [searchParams, router, supabase])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F9F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: 48,
        maxWidth: 480,
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F1117' }}>
              Verificando seu pagamento...
            </h2>
            <p style={{ color: '#8A8A85', marginTop: 8 }}>
              Aguarde um instante.
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F1117' }}>
              Pagamento confirmado!
            </h2>
            <p style={{ 
              color: '#1E8A4C', fontWeight: 600,
              marginTop: 8, fontSize: 16 
            }}>
              {plan === 'founder' ? 'Plano Fundador ativo ⭐' : 'Plano Builder ativo 🚀'}
            </p>
            <p style={{ color: '#8A8A85', marginTop: 12 }}>
              Redirecionando para criar sua conta...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function WhopCallbackPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <WhopCallbackContent />
    </Suspense>
  )
}
