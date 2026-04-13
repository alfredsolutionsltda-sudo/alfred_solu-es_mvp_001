'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { 
  Users, 
  FileText, 
  FileSignature, 
  Receipt, 
  BarChart2, 
  User, 
  Bell, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ChevronRight,
  MessageSquare,
  Map
} from 'lucide-react'
import { getContractAlertsAction } from '@/app/actions/contractActions'
import FeedbackModal from './FeedbackModal'

const navLinks = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/propostas', label: 'Propostas', icon: FileSignature },
  { href: '/fiscal', label: 'Fiscal', icon: Receipt },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
]

interface TopNavProps {
  userEmail?: string
  userName?: string
  userPlan?: string | null
}

export default function TopNav({ userEmail, userName, userPlan }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const displayName = userName || (userEmail?.split('@')[0] ?? 'Usuário')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Busca alertas inicialmente e a cada 5 minutos
  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await getContractAlertsAction()
      if (res.success) {
        setAlerts(res.data || [])
        setUnreadCount(res.count || 0)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Lock scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add('overflow-hidden-mobile')
    } else {
      document.body.classList.remove('overflow-hidden-mobile')
    }
  }, [isDrawerOpen])

  return (
    <>
      <nav className="fixed top-0 w-full h-20 z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/20 flex justify-between items-center px-4 md:px-8 lg:px-12 transition-all duration-300">
        {/* Logo + Hamburger + Nav Links */}
        <div className="flex items-center gap-4 md:gap-12 h-full">
          {/* Hamburger (Mobile/Tablet) */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 md:hidden text-neutral-600 hover:text-[#1455CE] transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[16px] overflow-hidden shadow-2xl shadow-[#1455CE]/20 group-hover:scale-110 transition-transform duration-500 ease-out border-2 border-white bg-white">
              <img 
                src="/images/alfred-head.png" 
                alt="Alfred" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <span className="text-lg md:text-xl font-headline font-black text-neutral-900 tracking-tighter leading-none">Alfred</span>
          </Link>

          {/* Links de navegação (Desktop) */}
          <div className="hidden md:flex items-center gap-2 h-full">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 lg:px-4 h-full flex items-center gap-2.5 text-[10px] lg:text-xs uppercase tracking-widest font-black transition-all duration-300 relative group overflow-hidden ${
                    isActive
                      ? 'text-[#1455CE]'
                      : 'text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:-translate-y-0.5" />
                  <span>{link.label}</span>
                  {isActive && (
                      <div className="absolute bottom-0 left-4 right-4 h-1 bg-[#1455CE] rounded-t-full shadow-[0_-4px_10px_rgba(20,85,206,0.3)]" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Ações do usuário */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Notificações */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 md:p-2.5 hover:bg-neutral-50 rounded-[14px] transition-all group border border-transparent hover:border-neutral-100"
              aria-label="Notificações"
            >
              <Bell className={`${unreadCount > 0 ? 'text-[#1455CE]' : 'text-neutral-400'} group-hover:text-[#1455CE] transition-colors`} size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 md:top-2.5 right-2 md:right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            {/* Dropdown de Notificações */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-80 md:w-96 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[60]">
                <div className="p-5 border-b border-neutral-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-neutral-900 uppercase tracking-widest">Notificações</p>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-[#1455CE]/10 text-[#1455CE] text-[10px] font-black rounded-full uppercase">
                        {unreadCount} Novas
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-10 text-center">
                       <Bell className="mx-auto text-neutral-100 mb-4" size={40} />
                       <p className="text-xs font-bold text-neutral-400">Tudo em dia por aqui!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-50">
                      {alerts.map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => {
                            setIsNotificationsOpen(false)
                            router.push('/contratos')
                            // O Drawer será aberto pela URL ou estado global se implementado, 
                            // por enquanto levamos até a página de contratos
                          }}
                          className="w-full p-5 text-left hover:bg-neutral-50 transition-colors flex gap-4 group"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            alert.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            {alert.type === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1455CE] mb-1">{alert.title}</p>
                            <p className="text-xs font-bold text-neutral-900 leading-tight mb-2">{alert.message}</p>
                            <div className="flex items-center gap-2">
                               <Clock size={10} className="text-neutral-300" />
                               <span className="text-[9px] font-bold text-neutral-400 uppercase">Ver detalhes</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-neutral-200 self-center group-hover:text-[#1455CE] transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {alerts.length > 0 && (
                  <Link 
                    href="/contratos"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="block p-4 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-[#1455CE] bg-neutral-50/50 transition-colors"
                  >
                    Ver todos os contratos
                  </Link>
                )}
              </div>
            )}
          </div>
          
          {/* Botão de Feedback */}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="p-2 md:p-2.5 hover:bg-[#1455CE]/5 text-neutral-400 hover:text-[#1455CE] rounded-[14px] transition-all border border-transparent hover:border-[#1455CE]/10 flex items-center gap-2 group"
            title="Enviar Feedback"
          >
            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Feedback</span>
          </button>

          {/* Avatar + Dropdown */}
          <div className="flex items-center gap-4 pl-4 md:pl-6 border-l border-neutral-100 relative" ref={dropdownRef}>
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.2em] leading-none mb-1">
                Operador
              </p>
              <p className="text-sm font-black text-neutral-900 tracking-tight">
                {userPlan === 'founder' && (
                  <span style={{
                    background: '#D97706',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 100,
                    letterSpacing: 1,
                    marginRight: 6,
                    verticalAlign: 'middle'
                  }}>
                    FUNDADOR
                  </span>
                )}
                {userPlan === 'builder' && (
                  <span style={{
                    background: '#1455CE',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 100,
                    letterSpacing: 1,
                    marginRight: 6,
                    verticalAlign: 'middle'
                  }}>
                    BUILDER
                  </span>
                )}
                {displayName}
              </p>
            </div>
            
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-[14px] md:rounded-[16px] p-[2px] bg-gradient-to-tr from-[#1455CE]/20 to-[#1455CE]/5 group relative overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95"
            >
              <div className="w-full h-full rounded-[12px] md:rounded-[14px] bg-white flex items-center justify-center border border-white shadow-inner group-hover:bg-[#1455CE]/5 transition-colors">
                <User className="text-[#1455CE]" size={20} strokeWidth={2.5} />
              </div>
            </button>

            {/* User Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-56 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-neutral-100 p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 mb-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Conta Ativa</p>
                    <p className="text-xs font-bold text-neutral-900 truncate">{userEmail}</p>
                </div>
                
                <Link
                  href="/perfil"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-neutral-600 hover:bg-[#1455CE]/5 hover:text-[#1455CE] rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-[#1455CE]/10 transition-colors">
                    <User size={16} />
                  </div>
                  Meu Perfil
                </Link>
                
                <div className="h-px bg-neutral-50 my-2 mx-2" />
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <LogOut size={16} />
                  </div>
                  Sair do Sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-500 ease-out flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-neutral-50">
              <Link href="/dashboard" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-[12px] overflow-hidden border-2 border-white bg-white shadow-lg">
                  <Image src="/images/alfred-head.png" alt="Alfred" fill className="object-contain p-1" />
                </div>
                <span className="text-lg font-headline font-black text-neutral-900">Alfred</span>
              </Link>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Navegação</p>
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                      isActive 
                        ? 'bg-[#1455CE]/5 text-[#1455CE]' 
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="p-6 border-t border-neutral-50">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[#1455CE]/5 flex items-center justify-center text-[#1455CE]">
                   <User size={24} strokeWidth={2.5} />
                 </div>
                 <div>
                   <p className="text-xs font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Perfil</p>
                   <p className="text-sm font-bold text-neutral-900 leading-none">{displayName}</p>
                 </div>
               </div>
               
               <button
                  onClick={() => {
                    setIsDrawerOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
               >
                 <LogOut size={18} />
                 Sair
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Feedback */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />
    </>
  )
}
