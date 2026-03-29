'use client';

import { ConversionByService as IConversionByService } from '@/types/reports';

interface ConversionByServiceProps {
  data: IConversionByService[];
}

export default function ConversionByService({ data }: ConversionByServiceProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5 md:gap-2">
          <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest">
            <span className="text-[#1A1C1B] truncate mr-2">{item.serviceType}</span>
            <div className="flex items-center gap-1.5 shrink-0">
               <span className="text-[#6B6D6B] font-medium normal-case hidden sm:inline">{item.accepted}/{item.proposals} aceitas</span>
               <span className="text-[#1455CE] font-black">{item.conversionRate.toFixed(0)}%</span>
            </div>
          </div>
          <div className="relative w-full h-2 md:h-3 bg-[#F9FAFB] rounded-full overflow-hidden border border-[#E2E3E1]">
            <div 
              className="absolute inset-y-0 left-0 bg-[#1455CE] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(20,85,206,0.3)]"
              style={{ width: `${item.conversionRate}%` }}
            />
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 text-[#6B6D6B] text-[10px] md:text-xs font-medium text-center border-2 border-dashed border-[#E2E3E1] rounded-2xl opacity-50">
          Nenhuma proposta enviada no período.
        </div>
      )}
    </div>
  );
}
