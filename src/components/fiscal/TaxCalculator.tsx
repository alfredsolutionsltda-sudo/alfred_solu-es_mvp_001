"use client";

import { useState, useEffect, useCallback } from 'react';
import { TaxCalculationResult, TaxRegime } from '@/types/fiscal';
import { Calculator, ChevronDown, CheckCircle2, AlertCircle, Info, Save } from 'lucide-react';
import { saveSimulationAction } from '@/app/actions/fiscalActions';

export default function TaxCalculator({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [revenue, setRevenue] = useState<string>('');
  const [annualRevenue, setAnnualRevenue] = useState<string>('');
  const [activity, setActivity] = useState<'Serviços' | 'Comércio+Indústria'>('Serviços');
  const [state, setState] = useState('SP');
  const [results, setResults] = useState<TaxCalculationResult[]>([]);
  const [activeRegime, setActiveRegime] = useState<TaxRegime>('MEI');

  const calculate = useCallback(async () => {
    if (!revenue || Number(revenue) === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/fiscal/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyRevenue: Number(revenue),
          annualRevenue: annualRevenue ? Number(annualRevenue) : Number(revenue) * 12,
          activityType: activity
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        
        // Mantém o regime selecionado ou atualiza se o usuário mudar
        const current = data.find((r: any) => r.regime === activeRegime);
        if (!current && data.length > 0) setActiveRegime(data[0].regime);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [revenue, annualRevenue, activity, activeRegime]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculate();
    }, 500);
    return () => clearTimeout(timer);
  }, [revenue, annualRevenue, activity, calculate]);

  const currentResult = results.find(r => r.regime === activeRegime) || (results.length > 0 ? results[0] : null);
  const bestRegime = results.find(r => r.isIdeal);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleAlfredExplain = () => {
    const question = `Alfred, me explica como ficaria minha situação fiscal com um faturamento mensal de ${formatCurrency(Number(revenue))} em ${activity}. O regime que estou analisando é ${activeRegime}.`;
    window.dispatchEvent(new CustomEvent('alfred-fiscal-query', { detail: { question } }));
  };

  const handleSaveSimulation = async () => {
    if (!currentResult) return;
    setIsSaving(true);
    const now = new Date();
    const result = await saveSimulationAction(userId, {
      regime: activeRegime,
      total: currentResult.total,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
    
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#E2E3E1] shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#1455CE]/5 flex items-center justify-center">
          <Calculator className="w-4 h-4 md:w-5 md:h-5 text-[#1455CE]" />
        </div>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-black text-[#1A1C1B]">Comparativo Fiscal</h3>
          <p className="text-[10px] text-[#6B6D6B] font-bold uppercase tracking-widest leading-none mt-0.5">Estimativas e Simulações</p>
        </div>
        
        {currentResult && (
          <button 
            onClick={handleSaveSimulation}
            disabled={isSaving || saveSuccess}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              saveSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-[#1455CE]/10 text-[#1455CE] hover:bg-[#1455CE] hover:text-white'
            }`}
          >
            {isSaving ? 'Salvando...' : saveSuccess ? <><CheckCircle2 className="w-3.5 h-3.5"/> Salvo!</> : <><Save className="w-3.5 h-3.5"/> Salvar</>}
          </button>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div>
          <label htmlFor="monthly-revenue" className="block text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider mb-1.5 opacity-60">Faturamento Mensal</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#6B6D6B]">R$</span>
            <input 
              id="monthly-revenue"
              type="number" 
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-4 py-3.5 md:py-3 bg-[#F4F4F2]/50 border-none rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-[#1455CE]/20 transition-all"
            />
          </div>
        </div>
        <div>
          <label htmlFor="tax-activity" className="block text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider mb-1.5 opacity-60">Atividade Principal</label>
          <div className="relative grow">
            <select 
              id="tax-activity"
              value={activity}
              onChange={(e: any) => setActivity(e.target.value)}
              className="w-full pl-4 pr-10 py-3.5 md:py-3 bg-[#F4F4F2]/50 border-none rounded-xl text-sm font-black outline-none appearance-none focus:ring-2 focus:ring-[#1455CE]/20 transition-all"
            >
              <option value="Serviços">Serviços</option>
              <option value="Comércio+Indústria">Comércio e Indústria</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6D6B] pointer-events-none stroke-[3px]" />
          </div>
        </div>
      </div>

      {/* Regimes Pills */}
      <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {(['MEI', 'Simples Nacional', 'Lucro Presumido', 'Autônomo/Carnê-Leão'] as TaxRegime[]).map((reg) => (
            <button
              key={reg}
              onClick={() => setActiveRegime(reg)}
              aria-pressed={activeRegime === reg}
              className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                activeRegime === reg 
                  ? 'bg-[#1455CE] text-white shadow-lg shadow-[#1455CE]/20' 
                  : 'bg-[#F4F4F2] text-[#6B6D6B] hover:bg-[#E2E3E1]'
              }`}
            >
              {reg}
            </button>
        ))}
      </div>

      {/* Result Display */}
      {currentResult ? (
        <div className="bg-[#F9FAFB] rounded-2xl p-5 md:p-6 mb-6 md:mb-8 border border-[#F2F4F7]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#6B6D6B] uppercase tracking-widest opacity-60">Estimado Mensal</span>
              <h4 className="text-2xl md:text-3xl font-black text-[#1455CE] leading-none tracking-tighter">
                {formatCurrency(currentResult.total)}
              </h4>
            </div>
            {currentResult.isIdeal && (
              <span className="inline-flex items-center w-fit gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
                <CheckCircle2 className="w-3.5 h-3.5"/> Regime Ideal
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {currentResult.breakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] md:text-xs">
                <span className="text-[#6B6D6B] font-medium">{item.label}</span>
                <span className="font-black text-[#1A1C1B]">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center p-8 text-center text-[#6B6D6B] border-2 border-dashed border-neutral-100 rounded-2xl mb-6">
          <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
             <Info className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 leading-relaxed">Insira seu faturamento<br/>para comparar regimes</p>
        </div>
      )}

      {/* Comparison Table */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-[#1A1C1B] uppercase tracking-widest opacity-50">Comparativo Geral</h4>
          <div className="rounded-xl border border-[#F2F4F7] overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left text-[10px] md:text-xs border-collapse min-w-[300px]">
                <thead className="bg-[#F9FAFB] text-[#6B6D6B] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Regime</th>
                    <th className="px-4 py-3 text-right">Imposto/mês</th>
                    <th className="px-4 py-3 text-right">Estimado/ano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F7]">
                  {results.map((res) => (
                    <tr 
                      key={res.regime}
                      className={`transition-colors h-12 ${res.isIdeal ? 'bg-emerald-50/20' : ''} ${activeRegime === res.regime ? 'bg-[#1455CE]/5 font-black' : ''}`}
                    >
                      <td className="px-4 py-2 flex items-center gap-2">
                         {res.regime}
                         {res.isIdeal && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>}
                      </td>
                      <td className="px-4 py-2 text-right text-[#1A1C1B]">
                        {formatCurrency(res.total)}
                      </td>
                      <td className="px-4 py-2 text-right text-[#1A1C1B]">
                        {formatCurrency(res.total * 12)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleAlfredExplain}
        className="mt-6 md:mt-8 group flex items-center justify-center gap-2 w-full py-4.5 md:py-4 rounded-2xl bg-neutral-900 text-white text-[11px] md:text-sm font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black active:scale-[0.98] transition-all"
      >
         Alfred, me explica isso 
         <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform stroke-[3px]" />
      </button>
    </div>
  );
}
