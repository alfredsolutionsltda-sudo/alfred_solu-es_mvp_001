'use client'

import { Profile } from '@/types/database'
import { Award, CheckCircle } from 'lucide-react'
import { getPlanConfig } from '@/types/plans'

interface ProfileSidebarProps {
  profile: Profile
}

export default function ProfileSidebar({ profile }: ProfileSidebarProps) {
  // Busca config do plano atual
  const planConfig = getPlanConfig(profile.plan)
  
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
      <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-6 border border-neutral-100">
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

      {/* Card de Plano Dinâmico */}
      {planConfig ? (
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '24px',
          border: `2px solid ${planConfig.badgeColor}20`,
          boxShadow: '0_4px_20px_rgba(0,0,0,0.03)',
        }}>
          <p style={{ fontSize: 11, color: '#8A8A85', 
            textTransform: 'uppercase', letterSpacing: 2,
            marginBottom: 8, fontWeight: 900 }}>
            Plano Atual
          </p>
          
          {/* Badge do plano */}
          <span style={{
            background: planConfig.badgeColor,
            color: 'white',
            borderRadius: 100,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            display: 'inline-block'
          }}>
            {planConfig.badge}
          </span>
          
          {/* Nome e preço */}
          <p style={{ 
            fontSize: 18, fontWeight: 700, 
            marginTop: 10, color: '#0F1117' 
          }}>
            {planConfig.name}
          </p>
          <p style={{ fontSize: 13, color: '#8A8A85' }}>
            {planConfig.price} · Vitalício
          </p>
          
          {/* Data de entrada */}
          {profile.plan_purchased_at && (
            <p style={{ fontSize: 11, color: '#8A8A85', marginTop: 6 }}>
              Membro desde{' '}
              {new Date(profile.plan_purchased_at)
                .toLocaleDateString('pt-BR', { 
                  month: 'long', year: 'numeric' 
                })}
            </p>
          )}
          
          {/* Badge especial para Founder */}
          {profile.plan === 'founder' && (
            <div style={{
              marginTop: 10,
              background: '#FEF3C7',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11,
              color: '#D97706',
              fontWeight: 600,
            }}>
              ⭐ Membro Fundador — Você ajudou a construir o Alfred
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: '#FEE2E2', borderRadius: 24,
          padding: '24px', border: '1px solid #FCA5A5',
          boxShadow: '0_4px_20px_rgba(0,0,0,0.03)',
        }}>
          <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
            Nenhum plano ativo
          </p>
          <a href="https://alfred.com.br/#planos" style={{
            fontSize: 12, color: '#DC2626', 
            textDecoration: 'underline', marginTop: 4,
            display: 'block'
          }}>
            Ver planos →
          </a>
        </div>
      )}
    </div>
  )
}
