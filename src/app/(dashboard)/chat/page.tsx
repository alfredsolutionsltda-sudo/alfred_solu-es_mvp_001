'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AlfredChatInput from '@/components/AlfredChatInput'
import { Bot, Sparkles, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ChatContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o Alfred. Como posso ajudar você hoje?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      handleSendMessage(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
          history: messages.slice(1) // Pula a mensagem inicial de boas vindas
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-headline font-black text-neutral-900 tracking-tight flex items-center gap-3">
            <Bot className="text-[#1455CE]" size={28} />
            Alfred Chat
          </h1>
          <p className="text-neutral-500 font-medium">Sua central de inteligência e comandos.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-neutral-900' : 'bg-[#1455CE]'
              }`}>
                {msg.role === 'user' ? <User size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
              </div>
              <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-neutral-100 text-neutral-800 rounded-tr-none' 
                  : 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-none border-l-4 border-l-[#1455CE]'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 items-center pl-14">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#1455CE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#1455CE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#1455CE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-auto pb-4">
        <AlfredChatInput 
          onSubmit={handleSendMessage} 
          placeholder="Peça para gerar um relatório, analisar um cliente ou apenas tire dúvidas..."
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-neutral-500">Iniciando Alfred...</div>}>
      <ChatContent />
    </Suspense>
  )
}
