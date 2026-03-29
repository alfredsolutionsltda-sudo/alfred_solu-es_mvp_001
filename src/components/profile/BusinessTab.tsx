'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { updateProfile } from '@/lib/actions/profile'
import Link from 'next/link'
import { Info, CheckCircle } from 'lucide-react'

const TAX_REGIMES = [
  'MEI',
  'Simples Nacional',
  'Lucro Presumido',
  'Autônomo (Carnê-Leão)',
  'Assalariado (CLT)' // Adicionado como opção extra
]

interface BusinessTabProps {
  profile: Profile
}

export default function BusinessTab({ profile }: BusinessTabProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showTaxWarning, setShowTaxWarning] = useState(false)
  
  const [formData, setFormData] = useState({
    profession: profile.profession || '',
    specialty: profile.specialty || '',
    registration_number: profile.registration_number || '',
    tax_regime: profile.tax_regime || '',
    services: Array.isArray(profile.services) ? profile.services.join(', ') : '',
    average_ticket: profile.average_ticket || 0,
    payment_terms: profile.payment_terms || ''
  })

  const handleTaxChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value
    setFormData({...formData, tax_regime: newVal})
    if (newVal !== profile.tax_regime) {
      setShowTaxWarning(true)
    } else {
      setShowTaxWarning(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Converte services string para array
    const dataToSave = {
      ...formData,
      services: formData.services.split(',').map(s => s.trim()).filter(s => s !== '')
    }

    const result = await updateProfile(profile.id, dataToSave)
    
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
        <h3 className="text-xl font-headline font-black text-neutral-900 tracking-tight">Meu Negócio</h3>
        <p className="text-sm font-medium text-neutral-500">Configure seu posicionamento e dados profissionais.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profissão */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Profissão Principal</label>
            <input 
              type="text" 
              value={formData.profession}
              onChange={(e) => setFormData({...formData, profession: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Ex: Engenheiro de Software"
            />
          </div>

          {/* Especialidade */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Sua Especialidade</label>
            <input 
              type="text" 
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Ex: Backend e Sistemas AI"
            />
          </div>

          {/* Número de Registro */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Número de Registro (CREA/OAB/CRM)</label>
            <input 
              type="text" 
              value={formData.registration_number}
              onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Ex: 123456-SP"
            />
          </div>

          {/* Regime Tributário */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Regime Tributário</label>
            <select 
              value={formData.tax_regime}
              onChange={handleTaxChange}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Selecione seu regime</option>
              {TAX_REGIMES.map(regime => (
                <option key={regime} value={regime}>{regime}</option>
              ))}
            </select>
            {showTaxWarning && (
              <div className="p-3 bg-[#1455CE]/5 border border-[#1455CE]/10 rounded-xl mt-2 flex gap-2">
                <Info className="text-[#1455CE] shrink-0" size={16} />
                <p className="text-[10px] font-bold text-[#1455CE] leading-tight">
                  Atualizar o regime aqui não altera suas obrigações fiscais automaticamente. Acesse <Link href="/fiscal" className="underline hover:opacity-80 transition-opacity">Fiscal → Trocar regime</Link> para migrar corretamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Serviços */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Serviços Oferecidos (separados por vírgula)</label>
          <textarea 
            value={formData.services}
            onChange={(e) => setFormData({...formData, services: e.target.value})}
            rows={2}
            className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all resize-none placeholder:text-neutral-300"
            placeholder="Ex: Consultoria, Auditoria de Segurança, Desenvolvimento Web"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ticket Médio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Ticket Médio (BRL)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400 text-sm">R$</span>
              <input 
                type="number" 
                value={formData.average_ticket || ''}
                onChange={(e) => setFormData({...formData, average_ticket: Number(e.target.value)})}
                className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 pl-10 pr-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Prazo de Pagamento */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Prazo/Forma de Pagamento</label>
            <input 
              type="text" 
              value={formData.payment_terms}
              onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
              className="w-full bg-neutral-50 border-none focus:ring-2 focus:ring-[#1455CE]/20 focus:bg-white rounded-xl py-3.5 px-4 outline-none font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              placeholder="Ex: 50% de entrada, 50% na entrega"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-neutral-100 text-right">
          <p className="hidden md:block text-xs font-bold text-neutral-400 text-left max-w-xs">
            {success ? (
              <span className="text-green-600 flex items-center gap-1 animate-in slide-in-from-left-2">
                <CheckCircle size={14} />
                Negócio atualizado!
              </span>
            ) : (
              'Esses dados alimentam a estratégia de crescimento do Alfred.'
            )}
          </p>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-[#1455CE] text-white rounded-xl font-bold hover:bg-[#114ab3] transition-all shadow-lg shadow-[#1455CE]/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Salvar Dados do Negócio
          </button>
        </div>
      </form>
    </div>
  )
}
