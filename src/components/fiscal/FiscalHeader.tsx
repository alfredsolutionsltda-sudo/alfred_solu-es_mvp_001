'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import ChangeRegimeModal from './ChangeRegimeModal';
import RegisterPaymentModal from './RegisterPaymentModal';

interface FiscalHeaderProps {
  userId: string;
  taxRegime: string;
}

export default function FiscalHeader({ userId, taxRegime }: FiscalHeaderProps) {
  const [isRegimeModalOpen, setIsRegimeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  return (
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-0 md:px-0">
      <div className="space-y-1 md:space-y-2">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <h1 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tighter">
            Fiscal & Prazos
          </h1>
          <span className="px-2 py-0.5 md:px-3 md:py-1 bg-primary/10 text-primary rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider">
            {taxRegime}
          </span>
        </div>
        <p className="text-on-surface-variant font-medium text-sm md:text-lg leading-snug">
          Gerencie seus impostos e planeje seu crescimento estratégico.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
        <button 
          onClick={() => setIsRegimeModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3.5 md:py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-all shadow-premium"
        >
          Trocar regime <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
        <button 
          onClick={() => setIsPaymentModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" /> Registrar pagamento
        </button>
      </div>

      <ChangeRegimeModal 
        isOpen={isRegimeModalOpen} 
        onClose={() => setIsRegimeModalOpen(false)} 
        userId={userId} 
        currentRegime={taxRegime} 
      />

      <RegisterPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        userId={userId} 
      />
    </header>
  );
}
