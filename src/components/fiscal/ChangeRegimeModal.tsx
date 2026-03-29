'use client';

import { useState } from "react";
import { X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateTaxRegimeAction } from "@/app/actions/fiscalActions";

const REGIMES = [
  { id: 'MEI', label: 'MEI', desc: 'Microempreendedor Individual' },
  { id: 'SIMPLES_NACIONAL', label: 'Simples Nacional', desc: 'Regime simplificado para ME/EPP' },
  { id: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido', desc: 'Baseado em alíquotas fixas' },
  { id: 'LUCRO_REAL', label: 'Lucro Real', desc: 'Baseado no faturamento líquido' },
];

export default function ChangeRegimeModal({ isOpen, onClose, userId, currentRegime }: { isOpen: boolean, onClose: () => void, userId: string, currentRegime: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentRegime);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleUpdate() {
    setIsLoading(true);
    setError(null);
    const result = await updateTaxRegimeAction(userId, selected);
    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Erro ao atualizar.");
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-[#E2E3E1]">
        <div className="px-8 py-6 border-b border-[#F2F4F7] flex justify-between items-center bg-[#F9FAFB]">
          <h2 className="text-xl font-black text-[#1A1C1B]">Regime Tributário</h2>
          <button onClick={onClose} className="text-[#6B6D6B] hover:text-[#1A1C1B] p-2 rounded-full hover:bg-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            {REGIMES.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                  selected === r.id 
                    ? 'border-[#1455CE] bg-[#F0F5FF]' 
                    : 'border-[#E2E3E1] hover:border-[#1455CE]/30 hover:bg-[#F9FAFB]'
                }`}
              >
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${selected === r.id ? 'text-[#1455CE]' : 'text-[#1A1C1B]'}`}>
                    {r.label}
                  </p>
                  <p className="text-[10px] font-bold text-[#6B6D6B] mt-0.5">{r.desc}</p>
                </div>
                {selected === r.id && <Check className="w-5 h-5 text-[#1455CE]" />}
              </button>
            ))}
          </div>

          <button 
            onClick={handleUpdate}
            disabled={isLoading || selected === currentRegime}
            className="w-full py-5 bg-[#1A1C1B] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 disabled:bg-gray-300 disabled:shadow-none"
          >
            {isLoading ? 'Atualizando...' : 'Confirmar Alteração'}
          </button>
        </div>
      </div>
    </div>
  );
}
