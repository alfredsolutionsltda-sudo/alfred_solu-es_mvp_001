"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AlfredFiscal({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCustomQuery = (event: any) => {
      const { question } = event.detail;
      if (question) {
        handleSend(question);
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('alfred-fiscal-query', handleCustomQuery);
    return () => window.removeEventListener('alfred-fiscal-query', handleCustomQuery);
  }, [userId, messages]); // Dependemos de userId e messages para que handleSend tenha acesso ao estado atual se necessário

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', content: msg } as Message];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, question: msg })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMsgs, { role: 'assistant', content: data.answer }]);
      }
    } catch (e) {
      console.error('Alfred Fiscal Chat Error:', e);
      setMessages([...newMsgs, { role: 'assistant', content: "Desculpe, tive um problema ao analisar isso agora. Por favor, tente novamente em instantes." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Me explica o DAS",
    "Simular Simples Nacional",
    "Quando pago IRPF?"
  ];

  return (
    <div ref={containerRef} className="bg-white rounded-2xl md:border-l-[6px] md:border-l-[#F79009] border border-[#E2E3E1] shadow-sm flex flex-col h-full overflow-hidden min-h-[450px] md:min-h-[500px]">
      <div className="p-3 md:p-4 border-b border-[#E2E3E1] flex items-center justify-between bg-white relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F79009] md:hidden" />
        <div className="flex items-center gap-2 pl-2 md:pl-0">
          <div className="w-8 h-8 rounded-lg bg-[#1455CE] flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[13px] md:text-sm font-black text-[#1A1C1B]">Alfred Fiscal AI</h3>
            <span className="text-[9px] md:text-[10px] font-bold text-[#027A48] uppercase tracking-wider">Consultor Inteligente</span>
          </div>
        </div>
        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F79009]" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 md:gap-4 bg-[#FDFDFD]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 md:gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 ${m.role === 'assistant' ? 'bg-[#1455CE] text-white' : 'bg-neutral-100 text-[#6B6D6B]'}`}>
              {m.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className={`px-3.5 py-2.5 text-xs font-medium leading-[1.6] max-w-[90%] md:max-w-[85%] shadow-sm ${
              m.role === 'assistant' 
                ? 'bg-white text-[#1A1C1B] rounded-[4px_16px_16px_16px] border border-neutral-200/60' 
                : 'bg-[#1455CE] text-white rounded-[16px_4px_16px_16px]'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-6 h-6 rounded-lg bg-[#1455CE] flex items-center justify-center shrink-0 mt-1 text-white shadow-md shadow-[#1455CE]/20">
               <Bot className="w-3.5 h-3.5" />
             </div>
             <div className="bg-white border border-neutral-200/60 rounded-[4px_16px_16px_16px] px-4 py-3 flex items-center gap-1.5 h-10 shadow-sm">
                <div className="w-1.5 h-1.5 bg-[#1455CE]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#1455CE]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#1455CE]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 md:p-4 bg-white border-t border-[#E2E3E1]">
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {suggestions.map((s) => (
            <button 
              key={s}
              onClick={() => handleSend(s)}
              className="px-3 py-2 bg-[#F9FAFB] border border-neutral-200/60 rounded-xl text-[10px] font-bold text-neutral-600 hover:border-[#1455CE] hover:text-[#1455CE] whitespace-nowrap transition-all active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Pergunte sobre impostos..."
            className="w-full bg-[#F4F4F2]/50 border-none rounded-2xl py-3.5 md:py-3 pl-4 pr-12 text-xs outline-none focus:ring-2 focus:ring-[#1455CE]/20 transition-all font-bold placeholder:text-neutral-400 placeholder:font-medium"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-[#1455CE] text-white disabled:opacity-30 transition-all shadow-md shadow-[#1455CE]/20 active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
