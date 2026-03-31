'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import ProfileSidebar from './ProfileSidebar'
import PersonalInfoTab from './PersonalInfoTab'
import BusinessTab from './BusinessTab'
import AlfredPreferencesTab from './AlfredPreferencesTab'
import SecurityTab from './SecurityTab'

import { User, Briefcase, Brain, Shield } from 'lucide-react'

interface ProfilePageProps {
  profile: Profile
}

export default function ProfilePage({ profile }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState('personal')

  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: User },
    { id: 'business', label: 'Meu Negócio', icon: Briefcase },
    { id: 'preferences', label: 'Preferências do Alfred', icon: Brain },
    { id: 'security', label: 'Segurança', icon: Shield },
  ]

  return (
    <main className="min-h-screen bg-surface pt-6 lg:pt-10 pb-16 px-4 lg:px-10 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
          <ProfileSidebar profile={profile} />
        </aside>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8 overflow-hidden">
          
          {/* Navegação por Abas com Scroll Horizontal no Mobile */}
          <div className="bg-surface-container-lowest p-1.5 rounded-2xl shadow-premium flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 lg:px-5 py-3 rounded-xl text-sm font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <tab.icon size={18} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Renderização da Aba Ativa */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'personal' && <PersonalInfoTab profile={profile} />}
            {activeTab === 'business' && <BusinessTab profile={profile} />}
            {activeTab === 'preferences' && <AlfredPreferencesTab profile={profile} />}
            {activeTab === 'security' && <SecurityTab profile={profile} />}
          </div>
        </div>
      </div>
    </main>
  )
}
