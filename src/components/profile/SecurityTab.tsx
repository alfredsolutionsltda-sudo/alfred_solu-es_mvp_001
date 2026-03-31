'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'
import { Lock, Monitor, AlertTriangle } from 'lucide-react'

interface SecurityTabProps {
  profile: Profile
}

export default function SecurityTab({ profile }: SecurityTabProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Alterar Senha
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  // Deletar Conta
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [confirmEmail, setConfirmEmail] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (passwordData.newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.updateUser({ 
      password: passwordData.newPassword 
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSuccess(true)
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(false), 5000)
    }
    setLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (confirmEmail !== profile.email) {
      setError('O e-mail digitado não coincide.')
      return
    }

    setLoading(true)
    const result = await deleteAccount(profile.id)
    
    if (result.success) {
      // Limpa sessão local e redireciona (a deleção do usuário já desloga globalmente)
      await supabase.auth.signOut()
      router.push('/login')
    } else {
      setError(result.error || 'Erro ao excluir conta.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Alterar Senha */}
      <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8 border border-neutral-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="text-[#1455CE]" size={20} />
            <h3 className="text-xl font-headline font-black text-neutral-900 tracking-tight">Alterar Senha</h3>
          </div>
          <p className="text-sm font-medium text-neutral-500">Sua segurança é nossa prioridade.</p>
        </div>

        <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Nova Senha</label>
            <input 
              type="password" 
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Confirmar Nova Senha</label>
            <input 
              type="password" 
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Digite novamente"
            />
          </div>

          {error && <p className="text-xs font-bold text-red-600 animate-in slide-in-from-left-2">{error}</p>}
          {success && <p className="text-xs font-bold text-green-600 animate-in slide-in-from-left-2">Senha alterada com sucesso!</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1455CE] text-white rounded-xl font-bold hover:bg-[#114ab3] transition-all shadow-lg shadow-[#1455CE]/20 disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>

      {/* Sessões e Segurança Extra */}
      <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6 border border-neutral-100">
        <div className="space-y-1">
          <h3 className="text-xl font-headline font-black text-neutral-900 tracking-tight">Privacidade e Dados</h3>
          <p className="text-sm font-medium text-neutral-500">Suas sessões ativas e controle de conta.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6 bg-neutral-50 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
              <Monitor size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Sessão Atual</p>
              <p className="text-xs font-medium text-neutral-500 italic">Navegador atual — Ativo agora</p>
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut({ scope: 'global' })}
            className="text-xs font-bold text-neutral-400 hover:text-[#1455CE] transition-colors hover:underline text-left sm:text-right"
          >
            Sair de todos os dispositivos
          </button>
        </div>

        {/* Zona de Perigo */}
        <div className="pt-8 border-t border-neutral-100">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-red-600 uppercase tracking-widest">Zona de Perigo</h4>
              <p className="text-xs font-bold text-neutral-500 leading-relaxed">
                Ao excluir sua conta, todos os seus dados (clientes, contratos, faturamento) serão removidos permanentemente. Esta ação não pode ser desfeita.
              </p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full md:w-auto px-6 py-3 border-2 border-red-100 text-red-600 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
            >
              Excluir minha conta
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Exclusão de Conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {deleteStep === 1 ? (
              <>
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={32} />
                </div>
                <h4 className="text-2xl font-headline font-black text-neutral-900 tracking-tight">Tem certeza de que deseja sair?</h4>
                <p className="text-neutral-500 font-medium leading-relaxed font-bold">
                  Esta ação é irreversível. Todas as suas configurações e dados do Alfred serão apagados para sempre.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="py-4 rounded-2xl font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-all"
                  >
                    Não, quero ficar
                  </button>
                  <button 
                    onClick={() => setDeleteStep(2)}
                    className="py-4 rounded-2xl font-bold text-white bg-red-600 hover:opacity-90 transition-all shadow-lg"
                  >
                    Sim, tenho certeza
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-2xl font-headline font-black text-neutral-900 tracking-tight">Confirme seu E-mail</h4>
                <p className="text-neutral-500 font-medium leading-relaxed">
                  Para proceder com a exclusão, digite seu e-mail abaixo: <br/> 
                  <span className="font-bold text-neutral-900">{profile.email}</span>
                </p>
                <input 
                  type="email" 
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full bg-neutral-50 border-2 border-red-100 focus:border-red-500 rounded-2xl py-4 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
                  placeholder="Seu e-mail aqui"
                />
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeleteStep(1)
                      setConfirmEmail('')
                    }}
                    className="py-4 rounded-2xl font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={confirmEmail !== profile.email || loading}
                    className="py-4 rounded-2xl font-bold text-white bg-neutral-900 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Processando...' : 'Excluir Definitivamente'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
