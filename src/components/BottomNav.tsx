'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  FileText, 
  FileSignature, 
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
  BarChart2,
  User,
  LogOut,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const mainLinks = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/propostas', label: 'Propostas', icon: FileSignature },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-neutral-100 flex items-center justify-around px-2 z-[60] pb-safe">
        {mainLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors ${
                isActive ? 'text-[#1455CE]' : 'text-neutral-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{link.label}</span>
            </Link>
          )
        })}

        {/* Mais Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors ${
            isMoreOpen ? 'text-[#1455CE]' : 'text-neutral-400'
          }`}
        >
          <MoreHorizontal size={20} strokeWidth={isMoreOpen ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Mais</span>
        </button>
      </div>

      {/* Mais Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMoreOpen(false)}
          />
          
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500 ease-out">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-headline font-black text-neutral-900">Mais Opções</h2>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/fiscal"
                onClick={() => setIsMoreOpen(false)}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-neutral-50 hover:bg-[#1455CE]/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-neutral-400 group-hover:text-[#1455CE] transition-colors border border-neutral-100">
                  <Receipt size={20} />
                </div>
                <span className="font-bold text-neutral-900">Fiscal</span>
              </Link>

              <Link
                href="/relatorios"
                onClick={() => setIsMoreOpen(false)}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-neutral-50 hover:bg-[#1455CE]/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-neutral-400 group-hover:text-[#1455CE] transition-colors border border-neutral-100">
                  <BarChart2 size={20} />
                </div>
                <span className="font-bold text-neutral-900">Relatórios</span>
              </Link>

              <Link
                href="/perfil"
                onClick={() => setIsMoreOpen(false)}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-neutral-50 hover:bg-[#1455CE]/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-neutral-400 group-hover:text-[#1455CE] transition-colors border border-neutral-100">
                  <User size={20} />
                </div>
                <span className="font-bold text-neutral-900">Perfil</span>
              </Link>

              <button
                onClick={() => {
                  setIsMoreOpen(false)
                  handleSignOut()
                }}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-400 border border-red-100">
                  <LogOut size={20} />
                </div>
                <span className="font-bold text-red-600">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
