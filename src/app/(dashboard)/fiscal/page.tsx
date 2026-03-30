import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getObrigacoes, getFiscalMetrics, getAnualProjection } from '@/lib/data/fiscal';
import FiscalMetricsCards from '@/components/fiscal/FiscalMetrics';
import ObrigacoesTable from '@/components/fiscal/ObrigacoesTable';
import FiscalAlerts from '@/components/fiscal/FiscalAlerts';
import FiscalHeader from '@/components/fiscal/FiscalHeader';

const ProjecaoAnual = dynamic(() => import('@/components/fiscal/ProjecaoAnual'), {
  loading: () => <div className="h-[400px] w-full bg-white animate-pulse rounded-3xl border border-[#E2E3E1]" />
});
const TaxCalculator = dynamic(() => import('@/components/fiscal/TaxCalculator'), {
  loading: () => <div className="h-[300px] w-full bg-white animate-pulse rounded-3xl border border-[#E2E3E1]" />
});
const AlfredFiscal = dynamic(() => import('@/components/fiscal/AlfredFiscal'), {
  loading: () => <div className="h-[400px] w-full bg-white animate-pulse rounded-3xl border border-[#E2E3E1]" />
});

export const metadata = {
  title: 'Fiscal & Prazos | Alfred',
  description: 'Acompanhe suas obrigações fiscais e simule regimes tributários.',
};

export default async function FiscalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;
  const currentYear = new Date().getFullYear();

  // Busca dados em paralelo para melhor performance
  const [metrics, obrigacoes, projection, { data: profile }] = await Promise.all([
    getFiscalMetrics(userId),
    getObrigacoes(userId, currentYear),
    getAnualProjection(userId, currentYear),
    supabase.from('profiles').select('*').eq('id', userId).single()
  ]);

  const taxRegime = profile?.tax_regime || 'Não definido';

  const melhorMes = projection.reduce((prev, current) => (prev.value > current.value) ? prev : current, projection[0]);
  const statusRegimeContext = profile?.tax_regime === 'MEI' && (metrics.meiLimitPercent || 0) > 80 
    ? 'Atenção - Limite próximo' 
    : 'Ideal';

  return (
    <main className="min-h-screen bg-surface p-5 md:pt-10 md:pb-16 md:px-10 max-w-[1400px] mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700">
      
      {/* Interactive Header */}
      <FiscalHeader userId={userId} taxRegime={taxRegime} />

      {/* Grid de Métricas */}
      <FiscalMetricsCards metrics={metrics} />

      {/* Layout Principal Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-2 md:pt-4">
        
        {/* Coluna Esquerda: Tabelas e Gráficos (Maior) */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-10">
          <div className="w-full h-full min-h-[400px] md:min-h-[500px]">
             <ObrigacoesTable obrigacoes={obrigacoes} />
          </div>
          
          <div className="w-full">
            <ProjecaoAnual 
              data={projection} 
              regimeAtual={taxRegime}
              economiaEstimada={0}
              periodoAnteriorValue={0}
              periodoAnteriorVariation={0}
              melhorMesLabel={melhorMes.month}
              melhorMesValue={melhorMes.value}
              statusRegimeContext={statusRegimeContext}
            />
          </div>
        </div>

        {/* Coluna Direita: Calculadora e Alfred (Menor) */}
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8 lg:sticky lg:top-24">
          <TaxCalculator userId={userId} />
          <AlfredFiscal userId={userId} />
        </div>
      </div>

      {/* Alertas de Rodapé */}
      <FiscalAlerts metrics={metrics} taxRegime={taxRegime} />

      {/* Roda-pé semântico/Footer de Status */}
      <footer className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">
        <span>Alfred Fiscal v1.0.5</span>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success"/> Conexão DB OK</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success"/> Tempo Real Ativado</span>
        </div>
      </footer>
    </main>
  );
}

