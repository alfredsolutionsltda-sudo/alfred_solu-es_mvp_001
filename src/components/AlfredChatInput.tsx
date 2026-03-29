'use client'

import { useState, KeyboardEvent } from 'react'
import { Sparkles, Send } from 'lucide-react'

interface AlfredChatInputProps {
  placeholder?: string
  context?: string // ex: "/contratos ativos"
  onSubmit?: (message: string) => void
}

export default function AlfredChatInput({
  placeholder = 'Pergunte algo ao Alfred...',
  context,
  onSubmit,
}: AlfredChatInputProps) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit?.(value.trim())
      setValue('')
    }
  }

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit?.(value.trim())
      setValue('')
    }
  }

  return (
    <div className="bg-white rounded-[24px] p-2 pl-6 border border-neutral-100 flex items-center gap-4 group focus-within:border-[#1455CE]/30 focus-within:shadow-[0_8px_30px_rgba(20,85,206,0.06)] transition-all duration-300 shadow-sm overflow-hidden">
      <div className="flex items-center justify-center w-5 h-5 shrink-0">
        <Sparkles
          size={18}
          className="text-[#1455CE] group-focus-within:animate-pulse"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Campo de mensagem para o Alfred"
        className="bg-transparent border-none flex-grow focus:outline-none focus:ring-0 text-sm font-bold text-neutral-800 placeholder:text-neutral-300 py-3"
      />
      {context && (
        <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100 cursor-pointer hover:bg-[#1455CE]/5 group/context transition-colors shrink-0">
          <span className="text-[10px] font-black text-[#1455CE] uppercase tracking-widest">
            {context}
          </span>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#1455CE] text-white hover:bg-[#114ab3] disabled:bg-neutral-100 disabled:text-neutral-300 transition-all shrink-0 active:scale-95 shadow-lg shadow-[#1455CE]/10"
        aria-label="Enviar pergunta"
      >
        <Send size={16} className={value.trim() ? 'fill-white' : ''} />
      </button>
    </div>
  )
}
