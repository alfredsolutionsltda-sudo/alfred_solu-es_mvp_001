'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { updateProfile } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'
import { Brain, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

const CONTRACT_TONES = [
  'Formal',
  'Neutro',
  'Amigável/Próximo',
  'Direto/Minimalista'
]

interface AlfredPreferencesTabProps {
  profile: Profile
}

export default function AlfredPreferencesTab({ profile }: AlfredPreferencesTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  
  const [formData, setFormData] = useState({
    client_profile: profile.client_profile || '',
    contract_tone: profile.contract_tone || '',
    special_clauses: profile.special_clauses || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await updateProfile(profile.id, formData)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setShowRegenModal(false)
    try {
      const response = await fetch('/api/ai/regenerate-context', { method: 'POST' })
      if (response.ok) {
        alert('Contexto do Alfred regenerado com sucesso!')
        router.refresh()
      } else {
        alert('Erro ao regenerar contexto.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRegenerating(false)
    }
  }

  const handleRedoOnboarding = async () => {
    setLoading(true)
    const result = await updateProfile(profile.id, { onboarding_completed: false })
    if (result.success) {
      router.push('/onboarding')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8 border border-neutral-100">
        <div className="space-y-1">
          <h3 className="text-xl font-headline font-black text-neutral-900 tracking-tight">Preferências do Alfred</h3>
          <p className="text-sm font-medium text-neutral-500">Como o Alfred deve agir em seu nome.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {/* Perfil de Cliente */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Perfil Típico de Cliente</label>
              <textarea 
                value={formData.client_profile}
                onChange={(e) => setFormData({...formData, client_profile: e.target.value})}
                rows={3}
                className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all resize-none placeholder:text-neutral-300"
                placeholder="Ex: Startups de tecnologia, Médicos autônomos..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tom do Contrato */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Tom de Contratos / Propostas</label>
                <select 
                  value={formData.contract_tone}
                  onChange={(e) => setFormData({...formData, contract_tone: e.target.value})}
                  className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione um tom</option>
                  {CONTRACT_TONES.map(tone => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>

              {/* Cláusulas Especiais */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Cláusulas / Observações Especiais</label>
                <input 
                  type="text" 
                  value={formData.special_clauses}
                  onChange={(e) => setFormData({...formData, special_clauses: e.target.value})}
                  className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
                  placeholder="Ex: Multa de 10% por atraso..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-neutral-100 text-right">
            <p className="text-xs font-bold text-neutral-400">
              {success ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  Alterações salvas!
                </span>
              ) : (
                'Salve antes de regenerar o contexto.'
              )}
            </p>
            <button 
              type="submit"
              disabled={loading || regenerating}
              className="px-8 py-3.5 bg-[#1455CE] text-white rounded-xl font-bold hover:bg-[#114ab3] transition-all shadow-lg shadow-[#1455CE]/20 disabled:opacity-50"
            >
              Salvar Preferências
            </button>
          </div>
        </form>
      </div>

      {/* Card de Contexto do Alfred */}
      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6 border border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="text-[#1455CE]" size={20} />
              <h3 className="text-xl font-headline font-black text-neutral-900 tracking-tight">Cérebro do Alfred</h3>
            </div>
            <p className="text-sm font-medium text-neutral-500">Este é o contexto que guia a inteligência do Alfred sobre você.</p>
          </div>
          
          <button 
            onClick={() => setShowRegenModal(true)}
            disabled={regenerating}
            className="flex items-center gap-2 px-6 py-3 bg-[#1455CE]/10 text-[#1455CE] rounded-xl text-xs font-bold hover:bg-[#1455CE]/20 transition-all disabled:opacity-50"
          >
            {regenerating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1455CE]/30 border-t-[#1455CE] rounded-full animate-spin" />
                Regenerando...
              </span>
            ) : (
              <>
                <RefreshCw size={16} />
                Regenerar contexto agora
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <textarea 
            readOnly
            value={profile.alfred_context || 'Nenhum contexto gerado.'}
            rows={8}
            className="w-full bg-neutral-50 border-none rounded-2xl p-6 font-mono text-xs text-neutral-500 outline-none resize-none leading-relaxed"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-50/50 pointer-events-none rounded-2xl" />
        </div>

        <div className="pt-4 flex justify-between items-center">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest max-w-[200px]">
             Não é possível editar este texto manualmente para manter a coerência da IA.
          </p>
          <button 
            onClick={() => setShowOnboardingModal(true)}
            className="text-xs font-bold text-neutral-400 hover:text-red-600 transition-colors underline underline-offset-4"
          >
            Refazer onboarding completo
          </button>
        </div>
      </div>

      {/* Modal Regenerar Contexto */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
               <AlertTriangle size={32} />
             </div>
            <h4 className="text-2xl font-headline font-black text-neutral-900 tracking-tight">Refazer Onboarding?</h4>
            <p className="text-neutral-500 font-medium leading-relaxed font-bold">
              Você será desconectado do dashboard e precisará conversar com o Alfred novamente para redefinir seu perfil.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowOnboardingModal(false)}
                className="py-4 rounded-2xl font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handleRedoOnboarding}
                className="py-4 rounded-2xl font-bold text-white bg-red-600 hover:opacity-90 transition-all shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Regenerar Contexto Manual */}
      {showRegenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-headline font-black text-neutral-900 tracking-tight">Regenerar Contexto?</h4>
            <p className="text-neutral-500 font-medium leading-relaxed">
              Isso vai atualizar como o Alfred age em seu nome usando suas informações atuais. Pode levar alguns segundos. Deseja continuar?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowRegenModal(false)}
                className="py-4 rounded-2xl font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRegenerate}
                className="py-4 rounded-2xl font-bold text-white bg-[#1455CE] hover:opacity-90 transition-all shadow-lg"
              >
                Sim, Regenerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
