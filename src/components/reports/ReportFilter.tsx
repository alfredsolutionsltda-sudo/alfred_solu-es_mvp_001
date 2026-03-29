'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { ReportPeriod } from '@/types/reports';

export default function ReportFilter({ currentPeriod }: { currentPeriod: ReportPeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periods = [
    { id: 'month', label: 'Mês' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'year', label: 'Ano' },
  ];

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    router.push(`/relatorios?${params.toString()}`);
  };

  return (
    <div className="flex bg-[#F4F4F2] p-1 rounded-2xl w-fit border border-[#E2E3E1]/50 shadow-inner">
      {periods.map((p) => (
        <button
          key={p.id}
          onClick={() => handlePeriodChange(p.id)}
          className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
            currentPeriod === p.id
              ? 'bg-white text-[#1A1C1B] shadow-sm scale-[1.02]'
              : 'text-[#6B6D6B] hover:text-[#1A1C1B] hover:bg-white/50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
