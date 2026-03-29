'use client'

import { TrendingDown, AlertTriangle } from 'lucide-react'

type InadimplenciaWidgetData = {
  totalInadimplente: number
  percentage: number
  history: { month: string; value: number }[]
}

export default function InadimplenciaCard({ data }: { data: InadimplenciaWidgetData }) {
  const { totalInadimplente, percentage, history } = data

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

  // Para o gráfico SVG
  const maxVal = Math.max(...history.map(d => d.value), 100) // minimum scale 100
  const width = 300
  const height = 80
  const padding = 20

  const getPoints = () => {
    if (history.length === 0) return ''
    return history.map((d, i) => {
      const x = padding + (i * ((width - padding * 2) / (history.length - 1 || 1)))
      const y = height - padding - ((d.value / maxVal) * (height - padding * 2))
      return `${x},${y}`
    }).join(' L ')
  }

  const formatMonth = (monthStr: string) => {
    const [year, m] = monthStr.split('-')
    const date = new Date(Number(year), Number(m) - 1, 1)
    return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
  }

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-500 group h-full relative">
      <div className="flex justify-between items-start mb-6 md:mb-10">
        <h3 className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest">
          INADIMPLÊNCIA
        </h3>
        <div className="px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold bg-red-50 text-red-600 flex items-center gap-1.5 transition-all group-hover:bg-red-100">
          <TrendingDown size={12} />
          {percentage.toFixed(1)}% <span className="hidden xs:inline">do faturamento</span>
        </div>
      </div>

      <div className="mb-6 md:mb-8 min-w-0">
        <h2 className="text-2xl md:text-4xl font-headline font-black tracking-tighter text-neutral-900 truncate">
          {formatCurrency(totalInadimplente)}
        </h2>
        <p className="text-[10px] md:text-[11px] font-bold text-red-500 mt-1.5 md:mt-2 flex items-center gap-1.5">
          <AlertTriangle size={14} className="stroke-[2.5px]" />
          Total atrasado <span className="hidden xs:inline">(mês atual)</span>
        </p>
      </div>

      <div className="mt-auto pt-6 border-t border-neutral-50">
        <p className="text-[10px] text-neutral-400 mb-4 font-bold uppercase tracking-widest flex justify-between items-center">
          Histórico 6 Meses
          <span className="text-[8px] font-black text-neutral-300">SVG DINÂMICO</span>
        </p>
        <div className="w-full relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-sm overflow-visible">
            {history.length > 0 && (
              <path
                d={`M ${getPoints()}`}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
              />
            )}
            {history.map((d, i) => {
              const x = padding + (i * ((width - padding * 2) / (history.length - 1 || 1)))
              const y = height - padding - ((d.value / maxVal) * (height - padding * 2))
              return (
                <circle key={i} cx={x} cy={y} r="4.5" fill="white" stroke="#dc2626" strokeWidth="2.5" className="transition-all duration-300 hover:r-6" />
              )
            })}
          </svg>
          <div className="flex justify-between w-full px-2 mt-3">
            {history.map((d, i) => (
              <span key={i} className="text-[9px] text-neutral-400 font-bold tracking-tight">{formatMonth(d.month)}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
