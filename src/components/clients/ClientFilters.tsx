"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search } from "lucide-react";

interface ClientFiltersProps {
  onNewClient: () => void;
  onImportCSV: () => void;
}

export default function ClientFilters({ onNewClient, onImportCSV }: ClientFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get('status') || 'todos';
  const currentSearch = searchParams.get('search')?.toString() || '';
  
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status !== 'todos') {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      if (searchTerm !== currentSearch) {
        startTransition(() => {
          replace(`${pathname}?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, replace, searchParams, currentSearch]);

  const tabs = [
    { id: 'todos', label: 'Todos' },
    { id: 'ativo', label: 'Ativos' },
    { id: 'inadimplente', label: 'Inadimplentes' },
    { id: 'inativo', label: 'Inativos' },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-[#F4F4F2] rounded-xl w-full md:w-fit border border-[#E2E3E1]/50 shadow-inner overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusChange(tab.id)}
              className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap ${
                currentStatus === tab.id
                  ? 'bg-white text-[#1A1C1B] shadow-sm'
                  : 'text-[#6B6D6B] hover:text-[#1A1C1B] hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onImportCSV}
            className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white border border-[#E2E3E1] rounded-xl text-[10px] md:text-xs font-black text-[#1A1C1B] hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest whitespace-nowrap"
          >
            Importar <span className="hidden xs:inline">CSV</span>
          </button>
          <button 
            onClick={onNewClient}
            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-[#1A1C1B] text-white rounded-xl text-[10px] md:text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 uppercase tracking-widest whitespace-nowrap"
          >
            + <span className="hidden xs:inline">Novo</span> Cliente
          </button>
        </div>
      </div>
      
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#6B6D6B]" />
        </div>
        <input
          type="text"
          placeholder="Buscar cliente por nome, documento ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-4 py-4 bg-white border border-[#E2E3E1] rounded-2xl text-sm font-medium placeholder-[#6B6D6B]/50 focus:outline-none focus:ring-2 focus:ring-[#1455CE]/10 focus:border-[#1455CE]/30 transition-all shadow-sm"
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <div className="animate-spin h-4 w-4 border-2 border-[#1455CE] border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
