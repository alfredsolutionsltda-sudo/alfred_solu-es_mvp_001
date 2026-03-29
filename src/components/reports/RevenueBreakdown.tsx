'use client';

import { RevenueBreakdown as IRevenueBreakdown } from '@/types/reports';

interface RevenueBreakdownProps {
  data: IRevenueBreakdown[];
}

export default function RevenueBreakdown({ data }: RevenueBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  // Cores personalizadas do design do Stitch
  const colors: Record<string, string> = {
    honorario_fixo: '#1455CE',
    por_demanda: '#0A3D99',
    reembolso: '#FF6492',
  };

  const labels: Record<string, string> = {
    honorario_fixo: 'Fixos',
    por_demanda: 'Performance (Demanda)',
    reembolso: 'Reembolsos',
  };

  // Cálculo dos arcos do Donut
  let cumulativePercent = 0;
  const slices = data.map(d => {
    const startPercent = cumulativePercent;
    cumulativePercent += d.percent;
    const endPercent = cumulativePercent;

    const startX = Math.cos(2 * Math.PI * startPercent / 100);
    const startY = Math.sin(2 * Math.PI * startPercent / 100);
    const endX = Math.cos(2 * Math.PI * endPercent / 100);
    const endY = Math.sin(2 * Math.PI * endPercent / 100);

    const largeArcFlag = d.percent > 50 ? 1 : 0;

    return {
      path: `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`,
      color: colors[d.type] || '#1455CE',
      type: d.type
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 w-full p-2">
      {/* Donut SVG */}
      <div className="relative w-32 h-32 md:w-48 md:h-48 shrink-0">
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
          {slices.map((slice, i) => (
            <path 
              key={i} 
              d={slice.path} 
              fill={slice.color} 
              className="hover:opacity-90 transition-opacity cursor-pointer" 
            />
          ))}
          {/* Furo do donut */}
          <circle cx="0" cy="0" r="0.75" fill="white" />
        </svg>
        
        {/* Texto Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-[8px] md:text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest leading-none mb-1">Total</span>
          <span className="text-[11px] md:text-sm font-black text-[#1A1C1B] truncate max-w-[80%]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(total)}
          </span>
        </div>
      </div>

      {/* Legenda Lateral */}
      <div className="flex-1 space-y-3 md:space-y-4 w-full">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col gap-1.5 ">
            <div className="flex justify-between items-center text-[9px] md:text-[10px] uppercase font-black tracking-widest">
              <span className="text-[#1A1C1B] truncate mr-2">{labels[d.type]}</span>
              <span className="text-[#6B6D6B] shrink-0">{d.percent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 md:h-2 bg-[#F9FAFB] rounded-full overflow-hidden">
               <div 
                  className="h-full rounded-full transition-all duration-1000 shadow-[inset_0_1px_1px_rgba(0,0,0,0.1)]" 
                  style={{ width: `${d.percent}%`, backgroundColor: colors[d.type] }}
               />
            </div>
            <span className="text-[9px] text-[#6B6D6B] font-bold opacity-60">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
