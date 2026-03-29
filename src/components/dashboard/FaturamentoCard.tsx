'use client'

import { DollarSign } from 'lucide-react'

type FaturamentoWidgetData = {
  total: number
  breakdown: {
    honorario_fixo: { value: number, percent: number }
    por_demanda: { value: number, percent: number }
    reembolso: { value: number, percent: number }
  }
}

export default function FaturamentoCard({ data }: { data: FaturamentoWidgetData }) {
  const { total, breakdown } = data

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-premium h-full flex flex-col hover:shadow-premium-hover transition-all duration-500">
      <div className="flex justify-between items-start mb-6 md:mb-8">
        <h3 className="text-[9px] md:text-[10px] font-black text-neutral-400 flex items-center gap-2 uppercase tracking-widest">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <DollarSign className="text-green-600 md:w-[18px] md:h-[18px]" size={16} />
          </div>
          FATURAMENTO
        </h3>
        <div className="bg-neutral-50 text-neutral-400 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold border border-neutral-100 shrink-0">
          Atualizado
        </div>
      </div>
      
      <div className="mb-6 md:mb-10 min-w-0">
        <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tighter text-neutral-900 truncate">
          {formatCurrency(total)}
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 font-bold mt-1.5 md:mt-2">Volume pago no período</p>
      </div>
      
      <div className="space-y-6 border-t border-neutral-50 pt-8 mt-auto">
        {/* Honorários Fixos */}
        <div className="space-y-2.5 group">
          <div className="flex justify-between text-xs font-bold transition-colors group-hover:text-[#1455CE]">
            <span className="text-neutral-500">Honorários Fixos ({breakdown.honorario_fixo.percent.toFixed(0)}%)</span>
            <span className="text-neutral-900">{formatCurrency(breakdown.honorario_fixo.value)}</span>
          </div>
          <div className="h-2 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100/50">
            <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${breakdown.honorario_fixo.percent}%` }} />
          </div>
        </div>

        {/* Por Demanda */}
        <div className="space-y-2.5 group">
          <div className="flex justify-between text-xs font-bold transition-colors group-hover:text-[#1455CE]">
            <span className="text-neutral-500">Por Demanda ({breakdown.por_demanda.percent.toFixed(0)}%)</span>
            <span className="text-neutral-900">{formatCurrency(breakdown.por_demanda.value)}</span>
          </div>
          <div className="h-2 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100/50">
            <div className="h-full bg-[#1455CE] rounded-full transition-all duration-1000" style={{ width: `${breakdown.por_demanda.percent}%`, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
          </div>
        </div>

        {/* Reembolso */}
        <div className="space-y-2.5 group">
          <div className="flex justify-between text-xs font-bold transition-colors group-hover:text-[#1455CE]">
            <span className="text-neutral-500">Reembolso ({breakdown.reembolso.percent.toFixed(0)}%)</span>
            <span className="text-neutral-900">{formatCurrency(breakdown.reembolso.value)}</span>
          </div>
          <div className="h-2 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100/50">
            <div className="h-full bg-orange-400 rounded-full transition-all duration-1000" style={{ width: `${breakdown.reembolso.percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
