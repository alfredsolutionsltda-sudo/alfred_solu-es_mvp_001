'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import Image from 'next/image'

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4 font-body">
        <div className="w-full max-w-[420px] text-center">
          <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
            <MailCheck className="text-green-500" size={40} />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight mb-3">
            Confirme seu e-mail
          </h1>
          <p className="text-neutral-500 font-medium">
            Enviamos um link de confirmação para <span className="text-neutral-900 font-bold">{email}</span>. Verifique sua caixa de entrada.
          </p>
          <Link href="/login" className="inline-block mt-8 text-[#1455CE] font-bold text-sm hover:opacity-80 transition-opacity">
            Voltar ao login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4 font-body py-8">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8 md:mb-10 group">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[22px] md:rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-[#1455CE]/20 group-hover:scale-110 transition-transform duration-500 ease-out border-2 border-white">
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

        {/* Card */}
        <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-neutral-100">
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight mb-2">
            Crie sua conta
          </h1>
          <p className="text-neutral-500 font-medium mb-6 md:mb-8 text-sm md:text-base">
            Entre com sua conta Alfred
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4 md:space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="João da Silva"
                className="w-full px-4 py-3 md:py-3.5 rounded-xl border-none bg-[#F4F4F2] text-neutral-900 font-medium text-base md:text-sm placeholder:text-neutral-400 focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                E-mail profissional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="voce@exemplo.com.br"
                className="w-full px-4 py-3 md:py-3.5 rounded-xl border-none bg-[#F4F4F2] text-neutral-900 font-medium text-base md:text-sm placeholder:text-neutral-400 focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 md:py-3.5 rounded-xl border-none bg-[#F4F4F2] text-neutral-900 font-medium text-base md:text-sm placeholder:text-neutral-400 focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1455CE] text-white py-3.5 md:py-4 rounded-xl font-bold text-sm shadow-lg shadow-[#1455CE]/20 hover:bg-[#114ab3] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center mt-2 uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Criar conta gratuita'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 font-medium mt-8">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-[#1455CE] font-bold hover:opacity-80 transition-opacity">
              Fazer login
            </Link>
          </p>
        </div>

        <p className="text-center text-[9px] md:text-[10px] text-neutral-400 mt-6 font-medium leading-relaxed px-4">
          Ao criar uma conta, você concorda com os{' '}
          <span className="text-neutral-600 font-semibold cursor-pointer hover:underline">Termos de Uso</span>
          {' '}e a{' '}
          <span className="text-neutral-600 font-semibold cursor-pointer hover:underline">Política de Privacidade</span>
        </p>
      </div>
    </main>
  )
}
