'use client';

import { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Send,
  ArrowRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { AlfredBriefingData, ReportPeriod, Projection } from '@/types/reports';

interface AlfredStrategicProps {
  userId: string;
  period: ReportPeriod;
  metricsData: AlfredBriefingData;
  projection: Projection;
}

interface StrategicAnalysis {
  opportunities: Array<{ title: string; description: string; action: string }>;
  risks: Array<{ title: string; description: string; impact: string }>;
}

export default function AlfredStrategic({ userId, period, metricsData, projection }: AlfredStrategicProps) {
  const [analysis, setAnalysis] = useState<StrategicAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchStrategic() {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period,
            metricsData,
            type: 'strategic'
          })
        });

        if (!response.ok) {
          let errorMsg = '';
          try {
            const errJson = await response.json();
            errorMsg = errJson.error || errJson.details || '';
          } catch {
            errorMsg = await response.text();
          }
          console.error('[AlfredStrategic] API Error:', response.status, errorMsg);
          return;
        }

        const data = await response.json();
        setAnalysis(data.result || null);
      } catch (error) {
        console.error('Error fetching strategic analysis:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStrategic();
  }, [period, metricsData]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isSending) return;
    
    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);
    setChatOpen(true);

    try {
      const response = await fetch('/api/ai/reports/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          metricsData
        })
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Seção 1 — Oportunidades */}
      <div id="opportunities-section" className="bg-[#12B76A]/5 border border-[#12B76A]/20 rounded-2xl p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-[#12B76A] rounded-lg text-white shrink-0">
            <Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#12B76A]">Oportunidades</span>
        </div>
        
        <div className="space-y-4">
          {loading ? (
             Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 w-1/2 bg-[#12B76A]/10 rounded" />
                  <div className="h-3 w-full bg-[#12B76A]/10 rounded" />
                </div>
             ))
          ) : (
            analysis?.opportunities.map((opt, i) => (
              <div key={i} className="group cursor-pointer">
                <h4 className="text-xs font-black text-[#1A1C1B] mb-1">{opt.title}</h4>
                <p className="text-[11px] text-[#6B6D6B] font-medium leading-relaxed mb-2">{opt.description}</p>
                <button 
                  onClick={() => handleSendMessage(`Me conte mais sobre a oportunidade: ${opt.title}`)}
                  className="px-3 py-1 bg-white border border-[#12B76A]/20 rounded-full text-[9px] font-bold text-[#12B76A] hover:bg-[#12B76A] hover:text-white transition-all"
                >
                  {opt.action} →
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seção 2 — Riscos */}
      <div id="risks-section" className="bg-[#F79009]/5 border border-[#F79009]/20 rounded-2xl p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-[#F79009] rounded-lg text-white shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#F79009]">Riscos Identificados</span>
        </div>
        
        <div className="space-y-4">
          {loading ? (
             <div className="space-y-2 animate-pulse">
                <div className="h-4 w-1/2 bg-[#F79009]/10 rounded" />
                <div className="h-3 w-full bg-[#F79009]/10 rounded" />
             </div>
          ) : (
            analysis?.risks.map((risk, i) => (
              <div key={i}>
                <h4 className="text-xs font-black text-[#1A1C1B] mb-1">{risk.title}</h4>
                <p className="text-[11px] text-[#6B6D6B] font-medium leading-relaxed mb-1">{risk.description}</p>
                <div className="text-[9px] font-black text-[#F79009] uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3 h-3" /> Impacto: {risk.impact}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seção 3 — Projeção Próximo Trimestre */}
      <div id="projections-section" className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-5 shadow-sm">
        <h3 className="text-[9px] md:text-[10px] font-black text-[#6B6D6B] uppercase tracking-widest mb-4">Projeção Mensal Próximo Ciclo</h3>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
           <div className="p-2 md:p-3 bg-gray-50 border border-[#E2E3E1] rounded-xl text-center flex flex-col justify-center min-h-[60px] md:min-h-0">
              <span className="text-[7px] md:text-[8px] font-black text-[#6B6D6B] uppercase">Pessimista</span>
              <p className="text-[9px] md:text-[10px] font-black text-[#1A1C1B] mt-1 truncate">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(projection.pessimistic)}
              </p>
           </div>
           <div className="p-2 md:p-3 bg-[#1455CE] border border-[#1455CE] rounded-xl text-center scale-105 shadow-lg shadow-blue-500/20 flex flex-col justify-center min-h-[60px] md:min-h-0">
              <span className="text-[7px] md:text-[8px] font-black text-white/70 uppercase">Base</span>
              <p className="text-[9px] md:text-[10px] font-black text-white mt-1 truncate">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(projection.base)}
              </p>
           </div>
           <div className="p-2 md:p-3 bg-gray-50 border border-[#E2E3E1] rounded-xl text-center flex flex-col justify-center min-h-[60px] md:min-h-0">
              <span className="text-[7px] md:text-[8px] font-black text-[#6B6D6B] uppercase">Otimista</span>
              <p className="text-[9px] md:text-[10px] font-black text-[#1A1C1B] mt-1 truncate">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(projection.optimistic)}
              </p>
           </div>
        </div>

      </div>

      <div className="bg-white border border-[#E2E3E1] rounded-2xl p-4 md:p-5 shadow-premium overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1455CE] rounded-lg text-white shrink-0">
              <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1A1C1B]">Consultoria Alfred</span>
          </div>
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            aria-label={chatOpen ? "Fechar chat estratégico" : "Abrir chat estratégico"}
            aria-expanded={chatOpen}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-[#6B6D6B] transition-transform ${chatOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {chatOpen && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Mensagens */}
            <div className="max-h-[250px] md:max-h-[350px] overflow-y-auto space-y-4 pr-1 custom-scrollbar scroll-smooth">
              {messages.length === 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] md:text-[12px] text-[#6B6D6B] font-medium leading-relaxed">
                    Olá! Sou o Alfred. Deseja analisar algum número específico do seu negócio hoje?
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      "Qual meu cliente mais lucrativo?",
                      "Simular aumento de 10% no preço",
                      "O que fazer com a inadimplência?"
                    ].map((suggestion, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-3 py-2.5 bg-[#F9FAFB] border border-[#E2E3E1] rounded-xl text-[9px] md:text-[10px] font-black text-[#1A1C1B] uppercase tracking-widest hover:border-[#1455CE] hover:text-[#1455CE] transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] md:max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[11px] md:text-xs font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#1455CE] text-white rounded-tr-none shadow-md shadow-blue-500/10' 
                      : 'bg-[#F9FAFB] text-[#1A1C1B] border border-[#E2E3E1] rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-[#F9FAFB] border border-[#E2E3E1] px-3 py-2.5 rounded-2xl rounded-tl-none animate-pulse">
                     <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#6B6D6B] rounded-full animate-bounce [animation-duration:800ms]" />
                        <div className="w-1.5 h-1.5 bg-[#6B6D6B] rounded-full animate-bounce [animation-duration:800ms] [animation-delay:200ms]" />
                        <div className="w-1.5 h-1.5 bg-[#6B6D6B] rounded-full animate-bounce [animation-duration:800ms] [animation-delay:400ms]" />
                     </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="relative mt-2">
              <input 
                id="strategic-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pergunte ao Alfred..."
                aria-label="Perguntar ao Alfred sobre estratégia"
                className="w-full pl-4 pr-12 h-11 md:h-12 bg-[#F9FAFB] border border-[#E2E3E1] rounded-xl text-[11px] md:text-sm font-medium focus:border-[#1455CE] focus:ring-2 focus:ring-[#1455CE]/10 outline-none transition-all placeholder:text-[#6B6D6B]/50"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isSending || !input.trim()}
                aria-label="Enviar pergunta"
                className="absolute right-1 top-1 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-[#1455CE] text-white rounded-lg hover:brightness-110 disabled:opacity-30 disabled:grayscale transition-all shadow-md shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
