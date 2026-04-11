import Link from 'next/link'

export default function AcessoNegadoPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F9F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-inter), system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: 48,
        maxWidth: 480,
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80,
          borderRadius: 22,
          overflow: 'hidden',
          background: 'white',
          boxShadow: '0 8px 32px rgba(20, 85, 206, 0.15)',
          border: '2px solid white',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src="/images/alfred-avatar.png" 
            alt="Alfred" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <h1 style={{ 
          fontSize: 22, fontWeight: 700, 
          color: '#0F1117', marginBottom: 8 
        }}>
          Acesso restrito
        </h1>
        
        <p style={{ 
          color: '#8A8A85', lineHeight: 1.6,
          marginBottom: 32, fontSize: 15 
        }}>
          A plataforma Alfred está disponível apenas para 
          quem adquiriu um dos planos de acesso antecipado.
        </p>

        {/* Opções */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <a
            href="https://alfred.com.br/#planos"
            style={{
              background: '#1455CE',
              color: 'white',
              borderRadius: 10,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'block',
            }}
          >
            Ver planos de acesso →
          </a>
          
          <Link
            href="/login"
            style={{
              color: '#8A8A85',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Já comprei — entrar com outra conta
          </Link>
        </div>

        <p style={{ 
          fontSize: 12, color: '#C4C4C4', 
          marginTop: 24 
        }}>
          Dúvidas? Entre em contato: ola@alfred.com.br
        </p>
      </div>
    </div>
  )
}
