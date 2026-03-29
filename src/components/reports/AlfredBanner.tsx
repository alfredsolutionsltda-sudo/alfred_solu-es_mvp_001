'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { AlfredBriefingData, ReportPeriod } from '@/types/reports';

interface AlfredBannerProps {
  userId: string;
  period: ReportPeriod;
  metricsData: AlfredBriefingData;
}

export default function AlfredBanner({ userId, period, metricsData }: AlfredBannerProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period,
            metricsData,
            type: 'analysis'
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
           console.error('[AlfredBanner] API Error:', response.status, errorMsg);
           
           if (response.status === 401) {
             setAnalysis('Sessão expirada. Por favor, recarregue a página.');
           } else {
             setAnalysis('O Alfred está processando muitos dados agora. Tente novamente em instantes.');
           }
           return;
        }

        const data = await response.json();
        setAnalysis(data.result || 'Análise indisponível.');
      } catch (error: any) {
        console.error('Error fetching Alfred analysis:', error);
        setAnalysis('O Alfred está temporariamente indisponível para esta análise.');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [period, metricsData]);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1455CE] to-[#0A3D99] p-5 md:p-8 text-white shadow-xl shadow-blue-500/10 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/5 rounded-full -mr-16 -mt-16 md:-mr-20 md:-mt-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-blue-400/10 rounded-full -ml-8 -mb-8 md:-ml-10 md:-mb-10 blur-2xl" />

      <div className="relative flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 md:gap-8">
        
        {/* Left Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit mb-4 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-100">
              Alfred Insights · {period === 'month' ? 'Mensal' : period === 'quarter' ? 'Trimestral' : 'Anual'}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-6 md:h-8 w-[95%] md:w-[90%] bg-white/10 rounded-lg animate-pulse" />
              <div className="h-6 md:h-8 w-[75%] md:w-[70%] bg-white/10 rounded-lg animate-pulse" />
            </div>
          ) : (
            <h2 className="text-lg md:text-2xl font-black leading-tight mb-4 max-w-2xl animate-in slide-in-from-left duration-500 tracking-tight">
              {analysis}
            </h2>
          )}
          
          <p className="text-blue-100/60 text-[11px] md:text-sm font-medium">
            Otimize sua performance com as recomendações baseadas no seu histórico.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col gap-2.5 md:gap-3 min-w-full lg:min-w-[260px]">
          <button 
            onClick={() => handleScroll('opportunities-section')}
            className="flex items-center justify-between w-full px-5 md:px-6 py-3.5 md:py-4 bg-white text-[#0A3D99] rounded-2xl text-[13px] md:text-sm font-black hover:bg-blue-50 active:scale-[0.98] transition-all group"
          >
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Ver Oportunidades</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => handleScroll('risks-section')}
            className="flex items-center justify-between w-full px-5 md:px-6 py-3.5 md:py-4 bg-white/10 text-white border border-white/20 rounded-2xl text-[13px] md:text-sm font-black hover:bg-white/20 active:scale-[0.98] transition-all group backdrop-blur-md"
          >
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Ver Riscos</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => handleScroll('projections-section')}
            className="text-[9px] md:text-[10px] font-black text-blue-200 uppercase tracking-widest text-center mt-2 hover:text-white transition-colors"
          >
            Análise preditiva disponível →
          </button>
        </div>
      </div>
    </div>
  );
}
