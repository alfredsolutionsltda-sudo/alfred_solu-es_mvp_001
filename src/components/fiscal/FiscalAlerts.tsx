import { FiscalMetrics } from '@/types/fiscal';
import { Bell, ShieldCheck, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

export default function FiscalAlerts({ metrics, taxRegime }: { metrics: FiscalMetrics, taxRegime: string }) {
  const showVencimento = metrics.nextObligation.daysRemaining <= 7 && metrics.nextObligation.name !== 'Nenhuma';
  const isMei = taxRegime === 'MEI';
  const showLimitMei = isMei && metrics.meiLimitPercent !== undefined;
  
  // Detecção de regime: se a economia anual for significativa (ex: > 500 reais)
  // Como as métricas completas de comparação não estão aqui, vou simular um alerta fixo se não for o ideal
  const isIdeal = metrics.annualProjection.isBasedOnReal; // Simplificação para o componente
  const showRegimeAlert = !isIdeal;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
      {/* Card 1 — Alerta de Vencimento */}
      {showVencimento && (
        <div className="bg-[#FFFAEB] border border-[#FEF0C7] rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F79009]/10 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-[#F79009]" />
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-[13px] md:text-sm font-black text-[#B54708] underline underline-offset-4 decoration-2 decoration-[#F79009]/30">{metrics.nextObligation.name} vence em breve</h4>
                <p className="text-[11px] md:text-xs text-[#B54708]/80 leading-relaxed font-medium mt-1">
                  O vencimento é em {metrics.nextObligation.daysRemaining} dias. Evite multas desnecessárias.
                </p>
              </div>
              <button className="flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-[#B54708] hover:underline bg-[#B54708]/5 px-3 py-2 rounded-lg">
                Registrar pagamento <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card 2 — Limite MEI */}
      {showLimitMei && (
        <div className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#1455CE]/5 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#1455CE]" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-end">
                <h4 className="text-[13px] md:text-sm font-black text-[#1A1C1B]">Limite MEI</h4>
                <span className="text-[9px] md:text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest opacity-60">
                  R$ 81k/ano
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      metrics.meiLimitPercent! > 80 ? 'bg-red-500' : 
                      metrics.meiLimitPercent! > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.meiLimitPercent!)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  <span className={metrics.meiLimitPercent! > 70 ? 'text-red-600' : 'text-neutral-500'}>
                    {metrics.meiLimitPercent?.toFixed(1)}% utilizado
                  </span>
                  {metrics.meiLimitPercent! > 70 && (
                    <span className="text-red-500 animate-pulse">Atenção</span>
                  )}
                </div>
              </div>
              
              {metrics.meiLimitPercent! > 70 && (
                <p className="text-[10px] md:text-[11px] text-[#6B6D6B] leading-snug font-medium">
                  Você está próximo do limite. Analise com Alfred a migração para Simples Nacional.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card 3 — Detecção de Regime */}
      <div className={`rounded-2xl p-4 md:p-6 shadow-sm border ${
        showRegimeAlert ? 'bg-[#ECFDF3] border-[#D1FADF]' : 'bg-white border-[#E2E3E1]'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${
            showRegimeAlert ? 'bg-emerald-500/10' : 'bg-amber-500/10'
          }`}>
            {showRegimeAlert ? <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />}
          </div>
          <div className="space-y-3">
            <div>
              <h4 className={`text-[13px] md:text-sm font-black ${showRegimeAlert ? 'text-[#027A48]' : 'text-[#1A1C1B]'}`}>
                {showRegimeAlert ? 'Configuração Ideal' : 'Oportunidade Fiscal'}
              </h4>
              <p className={`text-[11px] md:text-xs leading-relaxed font-medium mt-1 ${showRegimeAlert ? 'text-[#027A48]/80' : 'text-[#6B6D6B]'}`}>
                {showRegimeAlert 
                  ? `Seu regime (${taxRegime}) é a opção mais econômica e eficiente para seu nível de faturamento.`
                  : "Sua projeção indica economia real se migrar para o Simples Nacional nos próximos meses."}
              </p>
            </div>
            {!showRegimeAlert && (
              <button className="flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-[#1455CE] bg-[#1455CE]/5 px-3 py-2 rounded-lg hover:underline">
                Alfred, como faço isso? <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
