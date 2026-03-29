import { FiscalMetrics } from '@/types/fiscal';
import { Calendar, DollarSign, Clock, BarChart3 } from 'lucide-react';

export default function FiscalMetricsCards({ metrics }: { metrics: FiscalMetrics }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Imposto do Mês */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#E2E3E1] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#1455CE]/5 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-[#1455CE]" />
            </div>
            <span className="text-[10px] md:text-sm font-bold text-[#6B6D6B] uppercase tracking-tight md:normal-case md:tracking-normal">Imposto</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-[#1A1C1B] tracking-tighter">
            {formatCurrency(metrics.currentMonthTax.value)}
          </h3>
        </div>
        <div className="mt-3 md:mt-4 space-y-1.5">
          <span className={`inline-block text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
            metrics.currentMonthTax.status === 'pago' ? 'bg-[#ECFDF3] text-[#027A48]' : 'bg-[#FFFAEB] text-[#B54708]'
          }`}>
            {metrics.currentMonthTax.status === 'pago' ? '✓ Pago' : '⏳ Pendente'}
          </span>
          <p className="text-[9px] md:text-xs text-[#6B6D6B] font-bold">
            Vence {metrics.currentMonthTax.dueDate ? new Date(metrics.currentMonthTax.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '--'}
          </p>
        </div>
      </div>

      {/* Total Pago no Ano */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#E2E3E1] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#1455CE]/5 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-[#1455CE]" />
            </div>
            <span className="text-[10px] md:text-sm font-bold text-[#6B6D6B] uppercase tracking-tight md:normal-case md:tracking-normal">Total (Ano)</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-[#1A1C1B] tracking-tighter line-clamp-1">
            {formatCurrency(metrics.totalPaidYear.value)}
          </h3>
        </div>
        <div className="mt-3 md:mt-4">
          <div className="text-[9px] md:text-xs text-[#027A48] font-black uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg inline-block">
            ↑ {metrics.totalPaidYear.variation}%
          </div>
        </div>
      </div>

      {/* Próxima Obrigação */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#E2E3E1] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#F04438]/5 flex items-center justify-center shrink-0">
              <Clock className={`w-4 h-4 md:w-5 md:h-5 ${metrics.nextObligation.isUrgent ? 'text-[#F04438]' : 'text-[#1455CE]'}`} />
            </div>
            <span className="text-[10px] md:text-sm font-bold text-[#6B6D6B] uppercase tracking-tight md:normal-case md:tracking-normal">Próximo</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-[#1A1C1B] tracking-tighter">
            {metrics.nextObligation.daysRemaining} dias
          </h3>
        </div>
        <div className="mt-3 md:mt-4 space-y-1.5">
          <span className={`inline-block text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
            metrics.nextObligation.isUrgent ? 'bg-[#FEF3F2] text-[#B42318]' : 'bg-[#F9FAFB] text-[#475467]'
          }`}>
            {metrics.nextObligation.isUrgent ? '⚠ Atenção' : 'Programado'}
          </span>
          <p className="text-[9px] md:text-xs text-[#6B6D6B] font-bold truncate max-w-full">
            {metrics.nextObligation.name}
          </p>
        </div>
      </div>

      {/* Projeção Anual */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#E2E3E1] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#1455CE]/5 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#1455CE]" />
            </div>
            <span className="text-[10px] md:text-sm font-bold text-[#6B6D6B] uppercase tracking-tight md:normal-case md:tracking-normal">Projeção</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-[#1A1C1B] tracking-tighter">
            {formatCurrency(metrics.annualProjection.estimatedTotal)}
          </h3>
        </div>
        <div className="mt-3 md:mt-4">
          <div className="text-[9px] md:text-xs text-[#6B6D6B] font-bold uppercase tracking-widest opacity-60">
            Estimativa
          </div>
        </div>
      </div>
    </div>
  );
}
