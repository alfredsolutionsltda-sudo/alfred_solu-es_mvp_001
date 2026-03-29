import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAlfredBriefingData } from '@/lib/data/reports';
import { ReportPeriod } from '@/types/reports';
import AlfredBanner from '@/components/reports/AlfredBanner';
import ReportMetrics from '@/components/reports/ReportMetrics';
import ClientPerformanceTable from '@/components/reports/ClientPerformanceTable';
import ExecutiveSummary from '@/components/reports/ExecutiveSummary';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportActions from '@/components/reports/ReportActions';
import { Download, FileText } from 'lucide-react';

// Dynamic Imports para componentes pesados
const RevenueChart = dynamic(() => import('@/components/reports/RevenueChart'), {
  loading: () => <div className="h-[300px] md:h-[400px] w-full bg-surface-container-low animate-pulse rounded-xl" />
});
const RevenueBreakdown = dynamic(() => import('@/components/reports/RevenueBreakdown'), {
  loading: () => <div className="h-[200px] w-full bg-surface-container-low animate-pulse rounded-xl" />
});
const ConversionFunnel = dynamic(() => import('@/components/reports/ConversionFunnel'), {
  loading: () => <div className="h-[200px] w-full bg-surface-container-low animate-pulse rounded-xl" />
});
const ConversionByService = dynamic(() => import('@/components/reports/ConversionByService'), {
  loading: () => <div className="h-[150px] w-full bg-surface-container-low animate-pulse rounded-xl" />
});
const AlfredStrategic = dynamic(() => import('@/components/reports/AlfredStrategic'), {
  loading: () => <div className="h-[500px] w-full bg-surface-container-low animate-pulse rounded-3xl" />
});

export const metadata = {
  title: 'Relatórios | Alfred',
  description: 'Análise estratégica e financeira do seu negócio.',
};

interface ReportsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { period: periodParam } = await searchParams;
  const period = (periodParam as ReportPeriod) || 'month';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  // Busca dados de métricas no servidor
  const data = await getAlfredBriefingData(userId, period);

  return (
    <main className="min-h-screen bg-surface p-5 md:pt-10 md:pb-16 md:px-10 max-w-[1600px] mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700">
      
      {/* Header Standardized */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight">
            Relatórios
          </h1>
          <p className="text-on-surface-variant font-medium text-sm md:text-lg leading-relaxed max-w-xl">
            Visão estratégica alimentada por dados reais e inteligência Alfred.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full lg:w-auto">
          <div className="flex-1 sm:flex-initial">
             <ReportFilter currentPeriod={period} />
          </div>
          <div className="flex-1 sm:flex-initial">
             <ReportActions data={data} />
          </div>
        </div>
      </header>

      {/* Alfred Banner (AI Insights) */}
      <Suspense fallback={<div className="h-24 w-full bg-surface-container-low animate-pulse rounded-2xl" />}>
        <AlfredBanner userId={userId} period={period} metricsData={data} />
      </Suspense>

      {/* Grid de Métricas Principais */}
      <ReportMetrics metrics={data.metrics} />

      {/* Layout Principal: 60% Gráficos | 40% Alfred Strategic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start pt-2 md:pt-4">
        
        {/* Coluna Esquerda: Gráficos e Tabelas */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-10">
          
          {/* Faturamento vs Recebido */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 md:p-8 shadow-premium overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-headline font-bold text-on-surface">Faturamento vs Recebido</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 bg-primary opacity-50 rounded-sm" /> Faturado
                </span>
                <span className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 bg-success rounded-sm" /> Recebido
                </span>
              </div>
            </div>
            <div className="h-[300px] md:h-[400px] -mx-2">
              <RevenueChart data={data.revenueByMonth} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Breakdown de Receita */}
            <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-premium">
              <h3 className="text-[10px] md:text-sm font-black text-on-surface mb-6 uppercase tracking-widest text-on-surface-variant">Composição da Receita</h3>
              <div className="flex items-center justify-center py-2 md:py-4">
                <RevenueBreakdown data={data.breakdown} />
              </div>
            </div>

            {/* Funil de Conversão */}
            <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-premium">
              <h3 className="text-[10px] md:text-sm font-black text-on-surface mb-6 uppercase tracking-widest text-on-surface-variant">Funil de Propostas</h3>
              <div className="h-[200px] md:h-[250px] flex items-center justify-center">
                <ConversionFunnel data={data.funnel} />
              </div>
            </div>
          </div>

          {/* Performance por Cliente e Conversão por Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <ClientPerformanceTable data={data.clients} />
            <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-premium">
              <h3 className="text-[10px] md:text-sm font-black text-on-surface mb-6 uppercase tracking-widest text-on-surface-variant">Conversão por Serviço</h3>
              <ConversionByService data={data.serviceConversion} />
            </div>
          </div>

        </div>

        {/* Coluna Direita: Alfred Strategic Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8 lg:sticky lg:top-24">
          <AlfredStrategic 
            userId={userId} 
            period={period} 
            metricsData={data} 
            projection={data.projection}
          />
        </div>
      </div>

      {/* Resumo Executivo e Rodapé */}
      <ExecutiveSummary metricsData={data} />

      <footer className="mt-8 pt-6 md:pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest print:hidden opacity-40">
        <span>Alfred Intelligence v2.1.0</span>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-success"/> Dados em tempo real</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"/> IA Ativa</span>
        </div>
      </footer>
    </main>
  );
}

