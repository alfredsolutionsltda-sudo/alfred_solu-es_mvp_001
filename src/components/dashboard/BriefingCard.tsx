'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ChevronDown, ChevronUp, X, ArrowRight } from 'lucide-react'

export default function BriefingCard({ userId, briefingData }: { userId: string, briefingData: any }) {
  const [briefingItems, setBriefingItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const res = await fetch('/api/ai/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, briefingData })
        })
        const data = await res.json()
        if (data.briefing) {
          // Extrai linhas que começam com numeração, hífen ou asterisco
          const items = data.briefing
            .split('\n')
            .filter((line: string) => line.trim().match(/^(\d+\.|-|\*)/))
            .map((line: string) => line.replace(/^(\d+\.|-|\*)\s*/, '').trim())
            .filter((line: string) => line.length > 5)

          setBriefingItems(items.slice(0, 4)) // max 4 items
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchBriefing()
  }, [userId, briefingData])

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="mb-8 w-full bg-neutral-900 text-white p-5 rounded-2xl flex items-center justify-between hover:bg-neutral-800 transition-all shadow-premium group"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="text-[#1455CE]" size={20} />
          <span className="font-bold text-sm tracking-tight">Ver Briefing Diário do Alfred</span>
        </div>
        <ChevronDown className="text-neutral-500 group-hover:text-white transition-colors" size={20} />
      </button>
    )
  }

  return (
    <div className="mb-10 w-full bg-neutral-900 rounded-2xl p-8 shadow-premium relative overflow-hidden transition-all duration-500">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#1455CE]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-headline font-black text-white flex items-center gap-3">
          <Sparkles className="text-[#1455CE]" size={24} />
          Briefing Diário
        </h2>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-5/6 mb-6" />
              <div className="h-10 bg-white/5 rounded-xl w-full mt-auto" />
            </div>
          ))
        ) : briefingItems.length > 0 ? (
          briefingItems.map((item, i) => (
            <div key={i} className="bg-white/5 hover:bg-white/[0.08] transition-all rounded-2xl p-6 border border-white/5 flex flex-col justify-between group">
              <p className="text-sm font-medium text-neutral-300 leading-relaxed mb-8">
                {item}
              </p>
              <button 
                onClick={() => router.push(`/chat?q=${encodeURIComponent(item)}`)}
                className="w-full text-xs font-bold text-white bg-[#1455CE] hover:bg-[#114ab3] py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1455CE]/10"
              >
                Pedir ao Alfred
                <ArrowRight size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-neutral-500 font-bold bg-white/5 rounded-[24px] border border-white/5">
            Nenhuma ação prioritária identificada para hoje. Tudo tranquilo!
          </div>
        )}
      </div>
    </div>
  )
}
