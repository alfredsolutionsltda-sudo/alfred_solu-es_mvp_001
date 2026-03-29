'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangle className="text-red-500 w-10 h-10" />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-headline font-black text-neutral-900 mb-2">
        Ops! Algo não saiu como o esperado
      </h1>
      
      <p className="text-neutral-500 font-medium max-w-md mb-8 text-sm md:text-base">
        Encontramos um problema ao carregar esta página. Pode ser uma instabilidade temporária ou um erro de conexão.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-left max-w-2xl overflow-auto group">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Detalhes técnicos (apenas dev):</p>
          <code className="text-xs text-red-700 font-mono break-all">{error.message}</code>
          {error.digest && (
            <p className="text-[9px] text-red-400 mt-2 font-mono">Digest ID: {error.digest}</p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md">
        <button
          onClick={() => reset()}
          className="flex-1 flex items-center justify-center gap-2 bg-[#1455CE] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#114ab3] transition-all shadow-lg shadow-[#1455CE]/20 active:scale-[0.98]"
        >
          <RefreshCcw size={16} />
          Tentar novamente
        </button>
        
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-900 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm active:scale-[0.98]"
        >
          <Home size={16} />
          Voltar ao Início
        </Link>
      </div>
      
      <p className="mt-12 text-[10px] font-black text-neutral-300 uppercase tracking-widest">
        Se o problema persistir, informe o código: {error.digest || 'DASH-500'}
      </p>
    </div>
  );
}
