'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center bg-[#EFEFED] rounded-[32px] m-4">
      <div className="bg-white p-12 rounded-[32px] border border-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-lg w-full">
        <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="text-red-500" size={48} />
        </div>
        <h2 className="text-3xl font-headline font-black text-neutral-900 mb-4 tracking-tight">Algo deu errado!</h2>
        <p className="text-neutral-500 mb-10 font-medium leading-relaxed">
          Tivemos um problema inesperado ao carregar os dados do seu dashboard. O Alfred já foi notificado.
        </p>
        <button
          onClick={() => reset()}
          className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2.5 mx-auto active:scale-[0.98] shadow-xl shadow-black/10"
        >
          <RefreshCcw size={18} />
          Tentar novamente
        </button>
      </div>
    </main>
  )
}
