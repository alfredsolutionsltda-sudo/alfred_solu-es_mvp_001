'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message === 'User not found' ? 'E-mail não encontrado.' : 'Ocorreu um erro. Tente novamente.')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#EFEFED] px-4 font-body">
      <div className="w-full max-w-[420px] animate-[fadeIn_0.5s_ease-out] py-8">
        <div className="flex flex-col items-center justify-center mb-8 md:mb-10">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[22px] md:rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-[#1455CE]/20 border-2 border-white">
            <img 
              src="/images/alfred-head.png" 
              alt="Alfred" 
              className="w-full h-full object-contain p-1.5"
            />
          </div>
          <h1 className="mt-4 text-xl md:text-2xl font-headline font-black text-neutral-900 tracking-tighter">
            Alfred
          </h1>
        </div>

        <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white">
          <div className="mb-8 md:mb-10 text-center">
            <h2 className="text-xl md:text-2xl font-headline font-black text-neutral-900 tracking-tight mb-2">
              Recuperar senha
            </h2>
            <p className="text-neutral-400 font-bold text-xs md:text-sm tracking-tight">
              Enviaremos um link de recuperação para seu e-mail
            </p>
          </div>

          {error && (
            <div className="mb-6 md:mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-600 flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Send className="text-green-500 w-8 h-8" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-neutral-900">E-mail enviado!</p>
                <p className="text-sm text-neutral-500 font-medium">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-neutral-100 text-neutral-600 py-4 rounded-[18px] font-black text-[12px] uppercase tracking-widest hover:bg-neutral-200 transition-all"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                  Seu E-mail
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#1455CE] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="voce@exemplo.com.br"
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] border border-neutral-100 bg-neutral-50/50 text-neutral-900 font-bold text-base md:text-sm placeholder:text-neutral-400 focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1455CE] text-white py-4 rounded-[18px] md:rounded-[22px] font-black text-[12px] md:text-sm uppercase tracking-widest shadow-xl shadow-[#1455CE]/20 hover:bg-[#114ab3] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link de recuperação'}
              </button>

              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 text-neutral-400 font-bold text-xs hover:text-[#1455CE] transition-colors mt-4"
              >
                <ArrowLeft size={16} />
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
