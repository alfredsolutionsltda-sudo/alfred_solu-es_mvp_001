'use client';

import { FunnelData } from '@/types/reports';

interface ConversionFunnelProps {
  data: FunnelData;
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const steps = [
    { label: 'Enviadas', value: data.sent, color: '#1455CE' },
    { label: 'Aceitas', value: data.accepted, color: '#1455CE', opacity: 0.6 },
    { label: 'Pagas', value: data.paid, color: '#12B76A' },
  ];

  const maxVal = Math.max(data.sent, 1);
  const minWidth = 100; // Largura mínima da base do funil

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2 md:gap-4">
      <div className="w-full max-w-[280px] md:max-w-[300px]">
        <svg viewBox="0 0 300 180" className="w-full h-auto overflow-visible">
          <defs>
            <pattern id="hatch-funnel" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#1455CE" strokeWidth="2" strokeOpacity="0.3" />
            </pattern>
          </defs>

          {steps.map((step, i) => {
            const width = Math.max((step.value / maxVal) * 240, minWidth);
            const x = (300 - width) / 2;
            const y = i * 60;
            const height = 40;

            return (
              <g key={i}>
                {/* Barra do Funil */}
                <rect 
                  x={x} y={y} width={width} height={height} 
                  fill={i === 0 ? 'url(#hatch-funnel)' : step.color} 
                  fillOpacity={step.opacity || 1}
                  rx="12"
                  className="transition-all duration-700 hover:brightness-110"
                />
                {/* Texto Central */}
                <text 
                  x="150" y={y + height / 2 + 5} 
                  textAnchor="middle" 
                  className="text-[11px] font-black fill-white uppercase tracking-widest pointer-events-none"
                >
                  {step.value} {step.label}
                </text>

                {/* Conector e Taxa de Conversão */}
                {i < steps.length - 1 && (
                  <g>
                     <line 
                        x1="150" y1={y + height} x2="150" y2={y + height + 20} 
                        stroke="#E2E3E1" strokeWidth="2" strokeDasharray="4 4" 
                     />
                     <circle cx="150" cy={y + height + 10} r="12" fill="white" stroke="#E2E3E1" strokeWidth="1" />
                     <text 
                        x="150" y={y + height + 13.5} 
                        textAnchor="middle" 
                        className="text-[9px] font-black fill-[#1455CE]"
                     >
                       {data.conversionRates[i === 0 ? 'sentToAccepted' : 'acceptedToPaid'].toFixed(0)}%
                     </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="w-full h-px bg-[#E2E3E1]/50 my-2" />
      <div className="flex justify-between w-full px-2">
        <div className="text-center">
          <p className="text-[9px] font-black text-[#6B6D6B] uppercase tracking-wider mb-1">Conversão Geral</p>
          <p className="text-xs md:text-sm font-black text-[#1A1C1B]">
            {data.sent > 0 ? ((data.paid / data.sent) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black text-[#6B6D6B] uppercase tracking-wider mb-1">Ciclo Médio</p>
          <p className="text-xs md:text-sm font-black text-[#1A1C1B]">12 dias</p>
        </div>
      </div>
    </div>
  );
}
