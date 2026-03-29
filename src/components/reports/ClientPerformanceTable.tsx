'use client';

import { ClientPerformance } from '@/types/reports';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ClientPerformanceTableProps {
  data: ClientPerformance[];
}

export default function ClientPerformanceTable({ data }: ClientPerformanceTableProps) {
  const getPunctualityColor = (val: number) => {
    if (val >= 80) return '#12B76A';
    if (val >= 50) return '#1455CE';
    return '#F04438';
  };

  const getTrendIcon = (trend: 'up' | 'stable' | 'down') => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-[#12B76A]" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-[#F04438]" />;
    return <Minus className="w-3.5 h-3.5 text-[#6B6D6B]" />;
  };

  return (
    <div className="bg-white border border-[#E2E3E1] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-[#E2E3E1] flex items-center justify-between">
        <h3 className="text-[11px] md:text-sm font-black text-[#1A1C1B] uppercase tracking-wider">Performance por Cliente</h3>
        <span className="text-[9px] md:text-[10px] font-bold text-[#6B6D6B] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">Top 10 Volume</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[#E2E3E1]">
          {data.map((client, i) => (
            <div key={i} className="p-4 space-y-3 hover:bg-[#F9FAFB] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-[#1A1C1B] leading-tight break-words">{client.clientName}</span>
                  <span className="text-[11px] font-bold text-[#6B6D6B]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.volume)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-[#F9FAFB] rounded-lg shrink-0">
                  {getTrendIcon(client.trend)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-[#F9FAFB] border border-[#E2E3E1] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${client.punctuality}%`, 
                      backgroundColor: getPunctualityColor(client.punctuality) 
                    }} 
                  />
                </div>
                <span className="text-[9px] font-black text-[#1A1C1B] whitespace-nowrap">{client.punctuality.toFixed(0)}% pontual</span>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="px-6 py-12 text-center text-[#6B6D6B] text-[11px] font-medium opacity-50">
              Nenhum dado disponível.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB]/50 border-b border-[#E2E3E1]">
                <th className="px-6 py-4 text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest text-left">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest text-right">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest text-left">Pontualidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest text-center">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E3E1]">
              {data.map((client, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-[#1A1C1B] group-hover:text-[#1455CE] transition-colors line-clamp-1">{client.clientName}</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-xs font-bold text-[#1A1C1B]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.volume)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-1.5 bg-[#F9FAFB] border border-[#E2E3E1] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${client.punctuality}%`, 
                            backgroundColor: getPunctualityColor(client.punctuality) 
                          }} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-[#1A1C1B] w-8">{client.punctuality.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {getTrendIcon(client.trend)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-[#F9FAFB]/30 border-t border-[#E2E3E1] mt-auto">
        <Link 
          href="/clientes" 
          className="flex items-center justify-center gap-2 w-full h-11 bg-white border border-[#E2E3E1] rounded-xl text-[10px] font-black text-[#1A1C1B] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm group"
        >
          Ver todos os clientes <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
