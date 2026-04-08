'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check URL for Supabase Auth errors (like expired tokens)
    const hash = window.location.hash
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      const errorDesc = params.get('error_description')?.toLowerCase() || ''
      if (errorDesc.includes('token') || errorDesc.includes('expired')) {
        setError('Este link de redefinição expirou. Solicite um novo link.')
      } else {
        setError('Ocorreu um erro na autenticação.')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('token') || error.message.includes('expired')) {
        setError('Este link de redefinição expirou. Solicite um novo link.')
      } else {
        setError('E-mail ou senha inválidos. Tente novamente.')
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#EFEFED] px-4 font-body selection:bg-[#1455CE]/10">
      <div className="w-full max-w-[420px] animate-[fadeIn_0.5s_ease-out] py-8">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8 md:mb-10 group">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[22px] md:rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-[#1455CE]/20 group-hover:scale-110 transition-transform duration-500 ease-out border-2 border-white">
            <Image 
              src="/images/alfred-head.png" 
              alt="Alfred" 
              fill
              className="object-contain p-1.5"
            />
          </div>
          <h1 className="mt-4 text-xl md:text-2xl font-headline font-black text-neutral-900 tracking-tighter">
            Alfred
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white">
          <div className="mb-8 md:mb-10 text-center">
            <h2 className="text-xl md:text-2xl font-headline font-black text-neutral-900 tracking-tight mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-neutral-400 font-bold text-xs md:text-sm tracking-tight">
              Acesse sua central de inteligência
            </p>
          </div>

          {error && (
            <div className="mb-6 md:mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-600 flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#1455CE] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@exemplo.com.br"
                  className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] border border-neutral-100 bg-neutral-50/50 text-neutral-900 font-bold text-base md:text-sm placeholder:text-neutral-400 focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] focus:bg-white transition-all outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Senha
                </label>
                <Link href="/auth/reset-password" className="text-[9px] md:text-[10px] font-black text-[#1455CE] uppercase tracking-widest hover:opacity-70 transition-opacity">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#1455CE] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] border border-neutral-100 bg-neutral-50/50 text-neutral-900 font-bold text-base md:text-sm placeholder:text-neutral-400 focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] focus:bg-white transition-all outline-none shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1455CE] text-white py-4 md:py-4.5 rounded-[18px] md:rounded-[22px] font-black text-[12px] md:text-sm uppercase tracking-widest shadow-xl shadow-[#1455CE]/20 hover:bg-[#114ab3] hover:shadow-2xl hover:shadow-[#1455CE]/40 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn size={18} className="stroke-[2.5px]" />
                  Entrar no Alfred
                </>
              )}
            </button>
          </form>

          <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-neutral-50">
            <p className="text-center text-xs md:text-sm font-bold text-neutral-400 leading-relaxed">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-[#1455CE] font-black hover:underline transition-all block md:inline mt-1 md:mt-0">
                Crie seu acesso gratuito
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 md:mt-10 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">
                <ShieldCheck size={14} />
                <span>Criptografia 256-bit</span>
            </div>
        </div>
      </div>
    </main>
  )
}
