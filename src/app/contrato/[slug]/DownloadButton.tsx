'use client'

import { Download } from 'lucide-react'

export default function DownloadButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 flex items-center justify-center gap-2.5 w-full py-4 px-8 rounded-2xl bg-neutral-900 text-white text-sm font-black hover:bg-neutral-800 transition-all no-print shadow-xl shadow-black/10 active:scale-[0.98] uppercase tracking-widest"
    >
      <Download size={18} />
      Baixar Cópia do Contrato
    </button>
  )
}
