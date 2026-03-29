import { ArrowDownIcon, ArrowUpIcon, Users, DollarSign, AlertCircle, RefreshCw } from "lucide-react";

export default function ClientMetrics({ metrics }: { metrics: any }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 shadow-premium hover:shadow-premium-hover transition-all duration-500">
        <div className="flex justify-between items-start">
          <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Total Clientes</p>
          <div className="bg-neutral-50 p-1.5 md:p-2 rounded-lg shrink-0">
            <Users size={14} className="md:size-4 text-neutral-600" />
          </div>
        </div>
        <p className="text-xl md:text-3xl font-headline font-black mt-2 md:mt-4 text-neutral-900 tracking-tighter">{metrics.total}</p>
        <p className="text-[9px] md:text-[11px] text-neutral-400 mt-1 md:mt-2 font-bold uppercase tracking-widest">
          Ativos: <span className="text-[#1455CE]">{metrics.ativos}</span>
        </p>
      </div>
 
      <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 shadow-premium hover:shadow-premium-hover transition-all duration-500">
        <div className="flex justify-between items-start">
          <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1 truncate mr-2">Fat. Médio</p>
          <div className="bg-blue-50 p-1.5 md:p-2 rounded-lg shrink-0">
            <DollarSign size={14} className="md:size-4 text-[#1455CE]" />
          </div>
        </div>
        <p className="text-xl md:text-3xl font-headline font-black mt-2 md:mt-4 text-neutral-900 tracking-tighter truncate">{formatCurrency(metrics.avg_billing)}</p>
        <p className="text-[9px] md:text-[11px] text-neutral-400 mt-1 md:mt-2 font-bold uppercase tracking-widest truncate">p/ cliente / mês</p>
      </div>
 
      <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 shadow-premium hover:shadow-premium-hover transition-all duration-500 group">
        <div className="flex justify-between items-start">
          <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Inadimplência</p>
          <div className="bg-red-50 p-1.5 md:p-2 rounded-lg shrink-0">
            <AlertCircle size={14} className="md:size-4 text-red-600" />
          </div>
        </div>
        <p className="text-xl md:text-3xl font-headline font-black mt-2 md:mt-4 text-red-600 tracking-tighter truncate">{formatCurrency(metrics.inadimplency_total)}</p>
        <p className="text-[9px] md:text-[11px] text-red-600 mt-1 md:mt-2 font-bold uppercase tracking-widest truncate">
          {metrics.inadimplentes} em atraso
        </p>
      </div>
 
      <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 shadow-premium hover:shadow-premium-hover transition-all duration-500">
        <div className="flex justify-between items-start">
          <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Retenção</p>
          <div className="bg-green-50 p-1.5 md:p-2 rounded-lg shrink-0">
            <RefreshCw size={14} className="md:size-4 text-green-600" />
          </div>
        </div>
        <p className="text-xl md:text-3xl font-headline font-black mt-2 md:mt-4 text-green-600 tracking-tighter">{metrics.retention_rate}%</p>
        <p className="text-[9px] md:text-[11px] text-neutral-400 mt-1 md:mt-2 font-bold uppercase tracking-widest truncate">fidelidade</p>
      </div>
    </div>
  );
}
