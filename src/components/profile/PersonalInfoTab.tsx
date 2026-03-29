'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { updateProfile } from '@/lib/actions/profile'
import { CheckCircle } from 'lucide-react'

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT',
  'MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO',
  'RR','SC','SP','SE','TO'
]

interface PersonalInfoTabProps {
  profile: Profile
}

export default function PersonalInfoTab({ profile }: PersonalInfoTabProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    preferred_name: profile.preferred_name || '',
    document: profile.document || '',
    company_name: profile.company_name || '',
    state: profile.state || ''
  })

  // Detecta se é CPF ou CNPJ baseado no comprimento (simplificado)
  const getDocumentType = (val: string) => {
    const clean = val.replace(/\D/g, '')
    if (clean.length > 11) return 'CNPJ'
    return 'CPF'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    const result = await updateProfile(profile.id, formData)
    
    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      alert('Erro ao atualizar perfil: ' + result.error)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8 border border-neutral-100">
      <div className="space-y-1">
        <h3 className="text-xl font-headline font-black text-neutral-900 tracking-tight">Informações Pessoais</h3>
        <p className="text-sm font-medium text-neutral-500">Como você quer ser identificado no Alfred.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Nome Completo</label>
            <input 
              type="text" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Seu nome completo"
            />
          </div>

          {/* Nome Preferido */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Como Alfred deve te chamar?</label>
            <input 
              type="text" 
              value={formData.preferred_name}
              onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Ex: Victor"
            />
          </div>

          {/* Email (Desativado) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">E-mail (Principal)</label>
            <input 
              type="email" 
              value={profile.email}
              disabled
              className="w-full bg-neutral-50 border-none rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-400 cursor-not-allowed opacity-70"
            />
          </div>

          {/* Documento (CPF/CNPJ) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">
              CPF ou CNPJ <span className="text-[#1455CE]/50 text-[9px] ml-1">({getDocumentType(formData.document)})</span>
            </label>
            <input 
              type="text" 
              value={formData.document}
              onChange={(e) => setFormData({...formData, document: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="000.000.000-00"
            />
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Nome da Empresa (Opcional)</label>
            <input 
              type="text" 
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Ex: Alfred Soluções"
            />
          </div>

          {/* Estado (UF) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Estado (UF)</label>
            <select 
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Selecione um estado</option>
              {UF_LIST.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
          <p className="text-xs font-bold text-neutral-400">
            {success ? (
              <span className="text-green-600 flex items-center gap-1 animate-in slide-in-from-left-2">
                <CheckCircle size={14} />
                Alterações salvas com sucesso!
              </span>
            ) : (
              'Alfred usa esses dados para preencher seus contratos.'
            )}
          </p>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-[#1455CE] text-white rounded-xl font-bold hover:bg-[#114ab3] transition-all shadow-lg shadow-[#1455CE]/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}
