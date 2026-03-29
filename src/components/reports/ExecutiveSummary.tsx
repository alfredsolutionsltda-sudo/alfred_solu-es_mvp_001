'use client';

import { useState, useEffect } from 'react';
import { AlfredBriefingData } from '@/types/reports';
import { ShieldCheck, Target, Leaf, FileDown } from 'lucide-react';

interface ExecutiveSummaryProps {
  metricsData: AlfredBriefingData;
}

interface SummaryData {
  financial: string;
  commercial: string;
  sustainability: string;
}

export default function ExecutiveSummary({ metricsData }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period: 'period', // dummy as it's for summary
            metricsData,
            type: 'strategic'
          })
        });

        if (!response.ok) {
           let errorMsg = '';
           try {
             const errJson = await response.json();
             errorMsg = errJson.error || errJson.details || '';
           } catch {
             errorMsg = await response.text();
           }
           console.error('[ExecutiveSummary] API Error:', response.status, errorMsg);
           return;
        }

        const data = await response.json();
        if (data.result?.executiveSummary) {
          setSummary(data.result.executiveSummary);
        }
      } catch (error) {
        console.error('Error fetching executive summary:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [metricsData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
        {/* Saúde Financeira */}
        <div className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-6 shadow-sm flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1455CE]/10 rounded-lg text-[#1455CE] shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1A1C1B]">Saúde Financeira</span>
          </div>
          {loading ? (
             <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-[80%] bg-gray-100 rounded" />
             </div>
          ) : (
            <p className="text-[11px] md:text-xs text-[#6B6D6B] font-medium leading-relaxed">
              {summary?.financial}
            </p>
          )}
        </div>

        {/* Performance Comercial */}
        <div className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-6 shadow-sm flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#12B76A]/10 rounded-lg text-[#12B76A] shrink-0">
              <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1A1C1B]">Performance Comercial</span>
          </div>
          {loading ? (
             <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-[80%] bg-gray-100 rounded" />
             </div>
          ) : (
            <p className="text-[11px] md:text-xs text-[#6B6D6B] font-medium leading-relaxed">
              {summary?.commercial}
            </p>
          )}
        </div>

        {/* Sustentabilidade */}
        <div className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-6 shadow-sm flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#F79009]/10 rounded-lg text-[#F79009] shrink-0">
              <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1A1C1B]">Sustentabilidade</span>
          </div>
          {loading ? (
             <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-[80%] bg-gray-100 rounded" />
             </div>
          ) : (
            <p className="text-[11px] md:text-xs text-[#6B6D6B] font-medium leading-relaxed">
              {summary?.sustainability}
            </p>
          )}
        </div>
      </div>

      <button 
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-3 h-14 md:h-20 bg-[#1A1C1B] text-white rounded-2xl md:rounded-3xl text-[10px] md:text-sm font-black hover:bg-[#000] active:scale-[0.99] transition-all shadow-xl shadow-black/10 print:hidden uppercase tracking-widest"
      >
        <FileDown className="w-4 h-4 md:w-5 md:h-5" /> Exportar Relatório em PDF
      </button>

      <style jsx global>{`
        @media print {
          .print\\:hidden, 
          nav, 
          header, 
          aside,
          button,
          .sticky {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .animate-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
