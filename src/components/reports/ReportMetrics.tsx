'use client';

import { ReportMetrics as IReportMetrics } from '@/types/reports';
import { TrendingUp, TrendingDown, Wallet, Receipt, BarChart3, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportMetricsProps {
  metrics: IReportMetrics;
}

export default function ReportMetrics({ metrics }: ReportMetricsProps) {
  const cards = [
    {
      title: 'Faturamento Bruto',
      value: metrics.grossRevenue || 0,
      variation: metrics.variations.grossRevenue || 0,
      icon: <BarChart3 className="w-4 h-4 text-[#1455CE]" />,
      color: '#1455CE',
      isCurrency: true,
      suffix: ''
    },
    {
      title: 'Recebido',
      value: metrics.received || 0,
      variation: metrics.grossRevenue > 0 ? (metrics.received / metrics.grossRevenue) * 100 : 0,
      icon: <Wallet className="w-4 h-4 text-[#12B76A]" />,
      color: '#12B76A',
      isCurrency: true,
      isPercentageBadge: true,
      suffix: ''
    },
    {
      title: 'Inadimplência',
      value: metrics.delinquency || 0,
      variation: metrics.variations.delinquency || 0,
      icon: <AlertCircle className="w-4 h-4 text-[#F04438]" />,
      color: '#F04438',
      isCurrency: true,
      isNegative: true,
      suffix: ''
    },
    {
      title: 'Impostos Pagos',
      value: metrics.taxesPaid || 0,
      variation: metrics.variations.taxesPaid || 0,
      icon: <Receipt className="w-4 h-4 text-[#F79009]" />,
      color: '#F79009',
      isCurrency: true,
      suffix: ''
    },
    {
      title: 'Margem Líquida',
      value: metrics.netMargin || 0,
      variation: metrics.variations.netMargin || 0,
      icon: <TrendingUp className="w-4 h-4 text-[#12B76A]" />,
      color: '#12B76A',
      isCurrency: false,
      suffix: '%'
    }
  ];

  const formatValue = (val: number) => (isNaN(val) || !isFinite(val)) ? 0 : val;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {cards.map((card, i) => {
        const variationVal = formatValue(card.variation);
        
        return (
          <div key={i} className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="p-2 md:p-2.5 rounded-xl border border-[#E2E3E1] group-hover:bg-[#F9FAFB] transition-colors">
                {card.icon}
              </div>
              
              {/* Badge de Variação */}
              <div className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold flex items-center gap-1 ${
                card.isPercentageBadge 
                  ? 'bg-blue-50 text-blue-600'
                  : variationVal > 0 
                    ? card.isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
              }`}>
                {!card.isPercentageBadge && (variationVal > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />)}
                {card.isPercentageBadge ? `${variationVal.toFixed(0)}%` : `${Math.abs(variationVal).toFixed(0)}${card.isCurrency ? '%' : 'pp'}`}
              </div>
            </div>

            <div className="mb-4 md:mb-6">
              <h4 className="text-[9px] md:text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest mb-1 truncate">{card.title}</h4>
              <span className="text-sm md:text-xl font-black text-[#1A1C1B] leading-none">
                {card.isCurrency 
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(formatValue(card.value))
                  : `${formatValue(card.value).toFixed(1)}${card.suffix}`}
              </span>
            </div>

            {/* Mini Gráfico SVG */}
            <div className="h-4 md:h-6 flex items-end gap-[1.5px] md:gap-[2px]">
              {Array.from({ length: 12 }).map((_, j) => {
                const height = 20 + ((j * 7 + i * 13) % 61);
                return (
                  <div 
                    key={j} 
                    className="flex-1 rounded-t-[1px]" 
                    style={{ 
                      height: `${height}%`, 
                      backgroundColor: card.color,
                      opacity: 0.1 + (j/15)
                    }} 
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
