import Link from 'next/link'

export default function NotFound() {
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
        <div style={{ fontSize: 64, fontWeight: 900,
          color: '#1455CE', marginBottom: 8 }}>404</div>
        <h2 style={{ fontSize: 22, fontWeight: 700,
          marginBottom: 8, color: '#0F1117' }}>
          Página não encontrada
        </h2>
        <p style={{ color: '#8A8A85', marginBottom: 24 }}>
          Esta página não existe ou foi movida.
        </p>
        <Link href="/dashboard" style={{
          background: '#1455CE', color: 'white',
          borderRadius: 8, padding: '12px 24px',
          fontSize: 15, fontWeight: 600,
          textDecoration: 'none', display: 'inline-block'
        }}>
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
