"use client";

import { useState } from 'react';
import { MonthlyProjection } from '@/types/fiscal';
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';

interface ProjecaoAnualProps {
  data: MonthlyProjection[];
  regimeAtual: string;
  economiaEstimada: number;
  periodoAnteriorValue?: number;
  periodoAnteriorVariation?: number;
  melhorMesLabel?: string;
  melhorMesValue?: number;
  statusRegimeContext?: string;
}

export default function ProjecaoAnual({ 
  data, 
  regimeAtual, 
  economiaEstimada,
  periodoAnteriorValue = 0,
  periodoAnteriorVariation = 0,
  melhorMesLabel = '---',
  melhorMesValue = 0,
  statusRegimeContext = 'Ideal'
}: ProjecaoAnualProps) {
  const [view, setView] = useState<'mensal' | 'acumulado'>('mensal');

  const maxValue = Math.max(...data.map(d => d.value)) * 1.2;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const calculateAccumulated = (index: number) => {
    return data.slice(0, index + 1).reduce((acc, curr) => acc + curr.value, 0);
  };

  const maxAccumulated = calculateAccumulated(11) * 1.1;

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E2E3E1] shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-[#1A1C1B]">Projeção Anual de Impostos</h3>
          <p className="text-sm text-[#6B6D6B]">Baseado no faturamento real e estimado</p>
        </div>
        
        <div className="flex bg-[#F4F4F2] p-1 rounded-xl">
          <button 
            onClick={() => setView('mensal')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'mensal' ? 'bg-white text-[#1455CE] shadow-sm' : 'text-[#6B6D6B]'}`}
          >
            Mensal
          </button>
          <button 
            onClick={() => setView('acumulado')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'acumulado' ? 'bg-white text-[#1455CE] shadow-sm' : 'text-[#6B6D6B]'}`}
          >
            Acumulado
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-end gap-2 min-h-[240px] mb-8 relative">
        {/* Linhas de grade horizontais */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.05]">
          <div className="border-t border-[#1A1C1B] w-full" />
          <div className="border-t border-[#1A1C1B] w-full" />
          <div className="border-t border-[#1A1C1B] w-full" />
        </div>

        {data.map((item, i) => {
          const val = view === 'mensal' ? item.value : calculateAccumulated(i);
          const max = view === 'mensal' ? maxValue : maxAccumulated;
          const height = (val / max) * 100;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
              {/* Tooltip on hover */}
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#1A1C1B] text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none font-bold">
                {item.month} · {formatCurrency(val)} · {item.isPaid ? 'Pago' : 'Pendente'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1C1B]" />
              </div>

              {/* Barra */}
              <div 
                className={`w-full max-w-[32px] rounded-lg transition-all relative overflow-hidden group-hover:scale-x-110 group-hover:brightness-110 ${
                  item.isPaid 
                    ? 'bg-[#1455CE]/10' 
                    : item.status === 'atual' 
                      ? 'bg-gradient-to-t from-[#1455CE] to-[#3B6FE8]' 
                      : 'bg-[#F2F4F7]'
                }`}
                style={{ 
                  height: `${height}%`,
                  backgroundImage: item.isPaid 
                    ? 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(20,85,206,0.08) 8px, rgba(20,85,206,0.08) 10px)' 
                    : item.status === 'futuro'
                      ? 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(152,162,179,0.05) 8px, rgba(152,162,179,0.05) 10px)'
                      : undefined
                }}
              />
              
              <span className={`text-[10px] font-bold ${item.status === 'atual' ? 'text-[#1455CE]' : 'text-[#6B6D6B]'}`}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#E2E3E1]">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#6B6D6B] uppercase tracking-wider">Período Anterior</span>
          <p className="text-sm font-black text-[#1A1C1B]">
            {formatCurrency(periodoAnteriorValue)} 
            {periodoAnteriorVariation !== 0 && (
              <span className={`${periodoAnteriorVariation < 0 ? 'text-[#027A48]' : 'text-[#B42318]'} text-xs font-bold leading-none ml-1`}>
                {periodoAnteriorVariation < 0 ? '↓' : '↑'} {Math.abs(periodoAnteriorVariation)}%
              </span>
            )}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#6B6D6B] uppercase tracking-wider">Melhor Mês</span>
          <p className="text-sm font-black text-[#1A1C1B]">{melhorMesLabel} · {formatCurrency(melhorMesValue)}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#6B6D6B] uppercase tracking-wider">Status Regime</span>
          <p className="text-sm font-black text-[#1A1C1B]">{regimeAtual} · <span className="text-[#027A48] text-xs font-bold leading-none">{statusRegimeContext}</span></p>
        </div>
      </div>
    </div>
  );
}
