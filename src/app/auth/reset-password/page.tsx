'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, KeyRound } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isStrong = password.length >= 8

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (!isStrong) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      if (error.message.includes('token') || error.message.includes('expired')) {
        setError('Este link de redefinição expirou. Solicite um novo link.')
      } else {
        setError('Erro ao redefinir a senha. Tente novamente.')
      }
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#EFEFED] px-4 font-body selection:bg-[#1455CE]/10">
      <div className="w-full max-w-[420px] animate-[fadeIn_0.5s_ease-out] py-8">
        <div className="flex flex-col items-center justify-center mb-8 md:mb-10 group">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[22px] md:rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-[#1455CE]/20 group-hover:scale-110 transition-transform duration-500 ease-out border-2 border-white">
            <img 
              src="/images/alfred-head.png" 
              alt="Alfred" 
              className="w-full h-full object-contain p-1.5"
            />
          </div>
        </div>

        <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white">
          <div className="mb-8 md:mb-10 text-center">
            <h2 className="text-xl md:text-2xl font-headline font-black text-neutral-900 tracking-tight mb-2">
              Nova senha
            </h2>
            <p className="text-neutral-400 font-bold text-xs md:text-sm tracking-tight">
              Defina sua nova senha de acesso
            </p>
          </div>

          {error && (
            <div className="mb-6 md:mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-600 flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
              {error.includes('expirou') && (
                <button onClick={() => router.push('/login')} className="ml-auto underline">Solicitar novo</button>
              )}
            </div>
          )}

          {success ? (
            <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 text-[11px] font-bold text-green-600 flex flex-col items-center text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mb-2">✓</div>
              Senha atualizada com sucesso! Redirecionando...
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                  Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#1455CE] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] border border-neutral-100 bg-neutral-50/50 text-neutral-900 font-bold text-base md:text-sm placeholder:text-neutral-400 focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] focus:bg-white transition-all outline-none"
                  />
                </div>
                {password.length > 0 && (
                  <div className="flex px-1 gap-1 mt-2">
                    <div className={`h-1 flex-1 rounded-full ${password.length >= 4 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <div className={`h-1 flex-1 rounded-full ${isStrong ? 'bg-green-500' : 'bg-gray-200'}`} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#1455CE] transition-colors">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] border border-neutral-100 bg-neutral-50/50 text-neutral-900 font-bold text-base md:text-sm placeholder:text-neutral-400 focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isStrong || password !== confirmPassword}
                className="w-full bg-[#1455CE] text-white py-4 md:py-4.5 rounded-[18px] md:rounded-[22px] font-black text-[12px] md:text-sm uppercase tracking-widest shadow-xl shadow-[#1455CE]/20 hover:bg-[#114ab3] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
