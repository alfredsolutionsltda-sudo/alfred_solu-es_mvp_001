'use client'

import React, { useEffect, useState } from 'react'
import { Lightbulb } from 'lucide-react'

export default function AlfredInsightsCard({
  userId,
  briefingData,
  totalContracts,
  activeContracts,
  faturamentoPeriodo
}: {
  userId: string
  briefingData: any
  totalContracts: number
  activeContracts: number
  faturamentoPeriodo: number
}) {
  const [insight, setInsight] = useState<string | null>(null)

  useEffect(() => {
    // Busca apenas o primeiro item curado caso precisemos de um snippet rápido.
    const fetchInsight = async () => {
      try {
        const res = await fetch('/api/ai/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefingData, userId })
        })
        const data = await res.json()
        if (data.briefing) {
          // Extrai primeira frase
          const firstSentence = data.briefing.split('\n').find((line: string) => line.trim().length > 10)
          setInsight(firstSentence ? firstSentence.replace(/^[-\d.]+\s*/, '').trim() : null)
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    void fetchInsight()
  }, [briefingData, userId])

  const conversionPercentage = totalContracts > 0 ? ((activeContracts / totalContracts) * 100).toFixed(0) : '0'
  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

  return (
    <div className="lg:col-span-4 bg-gradient-to-br from-[#1455CE] via-[#114ab3] to-[#0d3b8f] rounded-2xl p-5 md:p-8 shadow-premium h-full flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-8 border border-white/10">
          <Lightbulb size={12} className="fill-white/80" />
          Alfred Insights
        </div>
        
        <h2 className="text-4xl md:text-7xl font-headline font-black tracking-tighter text-white mb-2 md:mb-4 group-hover:translate-x-1 transition-transform">
          {conversionPercentage}%
        </h2>
        
        <p className="text-white text-base md:text-lg font-headline font-bold leading-tight mb-4">
          de taxa de conversão em contratos ativos.
        </p>

        <p className="text-white/70 text-sm font-medium leading-relaxed min-h-[60px] italic">
          {insight ? (
            <span>"{insight}"</span>
          ) : (
             faturamentoPeriodo > 0 
                ? `Você atingiu ${formatCurrency(faturamentoPeriodo)} neste período. Mantenha o foco em cobranças pendentes.`
                : 'Aguardando o Alfred analisar seus dados...'
          )}
        </p>
      </div>
      
      <div className="mt-10 relative z-10 w-full">
        <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <div
            className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-1000 ease-out"
            style={{ width: `${Number(conversionPercentage)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
