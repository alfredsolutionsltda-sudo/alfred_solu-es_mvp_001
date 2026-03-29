'use client'

import { Profile } from '@/types/database'
import { Award, CheckCircle } from 'lucide-react'

interface ProfileSidebarProps {
  profile: Profile
}

export default function ProfileSidebar({ profile }: ProfileSidebarProps) {
  // Gera cor consistente baseada no nome
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 
      'bg-indigo-500', 
      'bg-violet-500', 
      'bg-purple-500', 
      'bg-fuchsia-500'
    ]
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[charCodeSum % colors.length]
  }

  const name = profile.preferred_name || profile.full_name || 'Usuário'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = getAvatarColor(name)

  // Cálculo de porcentagem de completude (cada campo vale ~9.1%)
  const fields = [
    profile.preferred_name,
    profile.profession,
    profile.specialty,
    profile.registration_number,
    profile.document,
    profile.state,
    profile.tax_regime,
    profile.services,
    profile.average_ticket,
    profile.contract_tone,
    profile.client_profile
  ]
  const completedFields = fields.filter((f) => f !== null && f !== undefined && f !== '' && (Array.isArray(f) ? f.length > 0 : true)).length
  const completionPercent = Math.round((completedFields / fields.length) * 100)

  return (
    <div className="space-y-6">
      {/* Card de Identidade */}
      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-6 border border-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-24 h-24 rounded-3xl ${avatarColor} flex items-center justify-center border-4 border-white shadow-lg text-white text-3xl font-black font-headline`}>
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-headline font-black text-neutral-900 tracking-tight">
              {name}
            </h2>
            <p className="text-neutral-500 font-bold text-sm uppercase tracking-widest">
              {profile.profession || 'Profissional'}
            </p>
          </div>
        </div>

        {/* Completude do Perfil */}
        <div className="pt-6 border-t border-neutral-100 text-left space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
              Completude do Perfil
            </span>
            <span className="text-sm font-black text-[#1455CE] leading-none">
              {completionPercent}%
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#1455CE] transition-all duration-1000 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 font-medium">
            Complete seu perfil para que o Alfred seja mais preciso em suas tarefas.
          </p>
        </div>
      </div>

      {/* Card de Plano */}
      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6 border border-[#1455CE]/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1455CE]/10 flex items-center justify-center">
            <Award className="text-[#1455CE]" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">
              Plano Atual
            </p>
            <h3 className="text-lg font-headline font-bold text-neutral-900">Fundador</h3>
          </div>
        </div>
        
        <div className="bg-neutral-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#1455CE]">
            <CheckCircle size={14} />
            <span className="text-xs font-bold">Acesso ilimitado</span>
          </div>
          <div className="flex items-center gap-2 text-[#1455CE]">
            <CheckCircle size={14} />
            <span className="text-xs font-bold">IA estrategista ativada</span>
          </div>
        </div>
        
        <div className="text-[10px] font-black text-green-600 uppercase tracking-widest text-center px-4 py-2 bg-green-50 rounded-full border border-green-100">
           Acesso Vitalício Ativado
        </div>
      </div>
    </div>
  )
}
