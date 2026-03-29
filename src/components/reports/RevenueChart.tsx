'use client';

import { RevenueByMonth } from '@/types/reports';
import { useState } from 'react';

interface RevenueChartProps {
  data: RevenueByMonth[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Responsive adjustments
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const paddingX = isMobile ? 30 : 50;
  const paddingY = 40;
  const width = 800; // Viewbox width (base)
  const height = 400; // Viewbox height
  const innerWidth = width - (paddingX * 2);
  const innerHeight = height - (paddingY * 2);

  const maxValue = Math.max(...data.map(d => Math.max(d.billed, d.received)), 1);
  const chartMax = maxValue * 1.1;

  const barWidth = (innerWidth / data.length) * 0.35;
  const gap = (innerWidth / data.length) * 0.1;

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center relative group/chart cursor-crosshair">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grids Horizontais */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = paddingY + (innerHeight / 4) * i;
          const val = chartMax - (chartMax / 4) * i;
          return (
            <g key={i}>
              <line 
                x1={paddingX} y1={y} x2={width - paddingX} y2={y} 
                stroke="#E2E3E1" strokeWidth="1" strokeDasharray="4 4" 
              />
              <text 
                x={paddingX - 8} y={y + 4} 
                textAnchor="end" className="text-[10px] md:text-[11px] font-black fill-[#6B6D6B] opacity-60"
              >
                {new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}
              </text>
            </g>
          );
        })}

        {/* Hatch Pattern para Billed */}
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#1455CE" strokeWidth="2" strokeOpacity="0.4" />
          </pattern>
        </defs>

        {/* Barras e Eixo X */}
        {data.map((d, i) => {
          const x = paddingX + (i * (innerWidth / data.length)) + (innerWidth / data.length / 2);
          const billedHeight = (d.billed / chartMax) * innerHeight;
          const receivedHeight = (d.received / chartMax) * innerHeight;
          const isHovered = hoveredIndex === i;

          // Skip some labels on mobile if too many
          const shouldShowLabel = !isMobile || data.length <= 6 || i % 2 === 0;

          return (
            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
              {/* Overlay invisível para hover */}
              <rect 
                x={x - (innerWidth / data.length / 2)} 
                y={paddingY} 
                width={innerWidth / data.length} 
                height={innerHeight} 
                fill="transparent" 
                className="cursor-pointer"
              />

              {/* Barra Billed (Hachura) */}
              <rect 
                x={x - barWidth - (gap / 2)} 
                y={paddingY + innerHeight - billedHeight} 
                width={barWidth} 
                height={billedHeight} 
                fill="url(#hatch)" 
                stroke="#1455CE"
                strokeWidth="1.5"
                className={`transition-all duration-300 ${isHovered ? 'stroke-2 opacity-100' : 'opacity-80'}`}
                rx="3"
              />

              {/* Barra Received (Sólido) */}
              <rect 
                x={x + (gap / 2)} 
                y={paddingY + innerHeight - receivedHeight} 
                width={barWidth} 
                height={receivedHeight} 
                fill="#12B76A" 
                className={`transition-all duration-300 ${isHovered ? 'scale-y-[1.02] opacity-100' : 'opacity-100'}`}
                rx="3"
              />

              {/* Rótulo do Mês */}
              {shouldShowLabel && (
                <text 
                  x={x} y={height - paddingY + 22} 
                  textAnchor="middle" 
                  className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest transition-colors ${isHovered ? 'fill-[#1455CE]' : 'fill-[#6B6D6B]'}`}
                >
                  {d.month}
                </text>
              )}

              {/* Tooltip Contextual */}
              {isHovered && (
                <foreignObject 
                  x={x > width / 2 ? x - 130 : x + 10} 
                  y={paddingY + innerHeight - Math.max(billedHeight, receivedHeight) - 40} 
                  width="130" 
                  height="90"
                  className="overflow-visible pointer-events-none"
                >
                  <div className="bg-[#1A1C1B] text-white p-3 rounded-2xl shadow-2xl text-[10px] space-y-1.5 animate-in zoom-in-95 duration-200 border border-white/10 backdrop-blur-md">
                    <p className="font-black uppercase tracking-widest border-b border-white/10 pb-1.5 mb-1.5 flex justify-between">
                      <span>{d.month}</span>
                      <span className="opacity-40">{d.year}</span>
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 font-bold uppercase tracking-tighter">Faturado</span>
                      <span className="font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(d.billed)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#12B76A] font-bold uppercase tracking-tighter">Recebido</span>
                      <span className="font-black text-[#12B76A]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(d.received)}</span>
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
