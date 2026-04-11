'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Sparkles, User, X, Minimize2 } from 'lucide-react'
import AlfredChatInput from '@/components/AlfredChatInput'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AlfredAssistantProps {
  isOpen: boolean
  onClose: () => void
}

export default function AlfredAssistant({ isOpen, onClose }: AlfredAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o Alfred. Como posso ajudar você hoje?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Autoscroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: messages.slice(1) 
        })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sinto muito, tive um problema técnico. Pode tentar de novo?' }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-[420px] max-w-[90vw] h-[600px] max-h-[80vh] bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.18)] border border-white/40 flex flex-col overflow-hidden animate-[scaleIn_0.3s_ease-out] ring-1 ring-black/5">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100/50 flex items-center justify-between bg-gradient-to-r from-[#1455CE]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-[#1455CE]/10 border border-neutral-100 overflow-hidden">
            <img 
              src="/images/alfred-head.png" 
              alt="Alfred" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-sm font-black text-neutral-900 tracking-tight uppercase">Alfred AI</h3>
            <p className="text-[10px] font-bold text-[#1455CE] uppercase tracking-widest opacity-80">Online & Pronto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {/* Botão de fechar */}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400 hover:text-neutral-900"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-neutral-900' : 'bg-white border border-neutral-100'
              } overflow-hidden`}>
                {msg.role === 'user' ? (
                  <User size={14} className="text-white" />
                ) : (
                  <img 
                    src="/images/alfred-head.png" 
                    alt="Alfred" 
                    className="w-full h-full object-contain p-0.5"
                  />
                )}
              </div>
              <div className={`p-4 rounded-2xl text-[13px] font-bold leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-neutral-100 text-neutral-800 rounded-tr-none' 
                  : 'bg-white border border-neutral-100 text-neutral-900 rounded-tl-none border-l-4 border-l-[#1455CE]'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 items-center pl-10">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#1455CE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#1455CE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#1455CE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white/50 backdrop-blur-md border-t border-neutral-100/50">
        <AlfredChatInput 
          onSubmit={handleSendMessage} 
          placeholder="Tire suas dúvidas agora..."
        />
      </div>
    </div>
  )
}
