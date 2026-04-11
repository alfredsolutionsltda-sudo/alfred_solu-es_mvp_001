'use client'

import { Contract } from '@/types/database'
import { FileText, MoreHorizontal } from 'lucide-react'

type ContratosWidgetData = {
  statuses: {
    gerados: number
    assinados: number
    ativos: number
    vencendo: number
    expirados: number
  }
}

export default function ContratosCard({ data }: { data: ContratosWidgetData }) {
  const { statuses } = data
  const { gerados, assinados, ativos, vencendo, expirados } = statuses

  const stats = [
    { value: gerados, label: 'Gerados', highlight: false },
    { value: assinados, label: 'Assinados', highlight: false },
    { value: ativos, label: 'Ativos', highlight: true },
    { value: vencendo, label: 'Vencendo', highlight: false },
    { value: expirados, label: 'Expirados', highlight: false },
  ]

  // Para o gráfico de funil, assumindo max height = max value
  const max = Math.max(gerados, assinados, ativos, vencendo, expirados) || 1
  
  const funnelHeights = stats.map(s => Math.max((s.value / max) * 100, 8))

  return (
    <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-premium flex flex-col hover:shadow-premium-hover transition-all duration-500">
      <div className="flex justify-between items-start mb-6 md:mb-10">
        <div className="w-full">
          <h3 className="text-[9px] md:text-[10px] font-black text-neutral-400 flex items-center gap-2 uppercase tracking-widest">
            <div className="w-8 h-8 rounded-lg bg-[#1455CE]/10 flex items-center justify-center shrink-0">
              <FileText className="text-[#1455CE] md:w-[18px] md:h-[18px]" size={16} />
            </div>
            CONTRATOS
          </h3>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap items-start md:items-end gap-6 md:gap-10 mt-6 md:mt-8">
            {stats.map(({ value, label, highlight }, i) => (
              <div key={label} className={`flex flex-col group cursor-default ${highlight ? 'sm:border-x border-neutral-100 sm:px-8 order-first xs:order-none' : ''}`}>
                <span className={`text-3xl md:text-4xl font-headline font-black tracking-tight ${highlight ? 'text-[#1455CE] md:text-5xl text-4xl' : 'text-neutral-900 group-hover:text-[#1455CE] transition-colors'}`}>
                  {value}
                </span>
                <span className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-1 ${highlight ? 'text-[#1455CE]' : 'text-neutral-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button className="p-2 text-neutral-300 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all shrink-0">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Gráfico de barras (Funil) */}
      <div className="relative flex-grow min-h-[220px] flex items-end gap-6 mb-10 px-4">
        <div className="h-full w-full absolute inset-0 pointer-events-none flex flex-col justify-between border-l border-b border-neutral-50/50">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-full border-t border-neutral-50 border-dashed" />
          ))}
        </div>
        {funnelHeights.map((h, i) => {
          const isAtivo = i === 2
          return (
            <div
              key={i}
              className={`relative group w-full rounded-t-xl transition-all duration-700 ease-out ${
                isAtivo
                  ? 'bg-gradient-to-t from-[#1455CE] to-[#2E6EEF] shadow-2xl shadow-[#1455CE]/20 z-10'
                  : 'bg-neutral-50 border-x border-t border-neutral-100 hover:bg-neutral-100 cursor-pointer'
              }`}
              style={{ height: `${h}%` }}
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-5 py-3 rounded-2xl text-xs whitespace-nowrap shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all origin-bottom duration-300 z-30">
                <p className="font-headline font-black text-sm mb-0.5">{stats[i].value} contratos {stats[i].label.toLowerCase()}</p>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900 rotate-45" />
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
