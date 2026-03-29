'use client'

import type { ContractMetrics } from '@/types/contracts'
import { FileText, Clock, Calendar, DollarSign } from 'lucide-react'

interface ContractMetricsProps {
  metrics: ContractMetrics
  mode?: 'contracts' | 'proposals'
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  })
}

export default function ContractMetrics({ metrics, mode = 'contracts' }: ContractMetricsProps) {
  const isProposals = mode === 'proposals'

  const cards = [
    {
      key: 'totalAtivos' as const,
      title: isProposals ? 'Propostas Ativas' : 'Contratos Ativos',
      icon: FileText,
      color: 'green',
      format: (v: number) => String(v),
    },
    {
      key: 'pendentesAssinatura' as const,
      title: isProposals ? 'Pendentes de Aceite' : 'Pendentes de Assinatura',
      icon: Clock,
      color: 'amber',
      format: (v: number) => String(v),
    },
    {
      key: 'vencendoEm30Dias' as const,
      title: isProposals ? 'Expirando em 30 dias' : 'Vencendo em 30 dias',
      icon: Calendar,
      color: 'orange',
      format: (v: number) => String(v),
    },
    {
      key: 'valorTotalAtivo' as const,
      title: isProposals ? 'Valor Total Propostas' : 'Valor Total Ativo',
      icon: DollarSign,
      color: 'primary',
      format: (v: number) => formatCurrency(v),
    },
  ]

  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
    primary: { bg: 'bg-blue-50', text: 'text-[#1455CE]', dot: 'bg-[#1455CE]' },
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {cards.map((card) => {
        const colors = colorMap[card.color]
        const value = metrics[card.key]
        const Icon = card.icon

        return (
          <div
            key={card.key}
            className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 shadow-premium hover:shadow-premium-hover transition-all duration-500 group relative overflow-hidden"
          >
            <div className="relative z-10 w-full">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${colors.bg} flex items-center justify-center transition-all group-hover:scale-110 shrink-0`}>
                  <Icon className={`${colors.text} w-4 h-4 md:w-5 md:h-5`} size={16} />
                </div>
                <h3 className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right mt-1 ml-2 line-clamp-2">
                  {card.title}
                </h3>
              </div>

              <div className="flex items-end justify-between gap-2">
                <h2 className="text-xl md:text-3xl font-headline font-black tracking-tighter text-neutral-900 truncate">
                  {card.format(value)}
                </h2>

                <div className="hidden xs:flex gap-1 items-end h-6 md:h-8 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                  {[3, 6, 4, 8, 5].map((h, i) => (
                    <div
                      key={i}
                      className={`w-0.5 md:w-1 rounded-full ${colors.dot}`}
                      style={{ height: `${h * 2}px`, opacity: (i + 1) * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
