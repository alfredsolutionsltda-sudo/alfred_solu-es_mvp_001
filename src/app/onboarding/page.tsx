"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Send, Bot, User, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(1);
  const [onboardingData, setOnboardingData] = useState<any>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const initDocs = async () => {
      if (initialized) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const startBlock = profile?.preferred_name ? 
        (profile?.profession ? 
          (profile?.tax_regime ? 
            (profile?.services ? 5 : 4) 
          : 3) 
        : 2) 
      : 1;

      setCurrentBlock(startBlock);
      
      if (startBlock > 1) {
         setMessages([
          { 
            role: 'assistant', 
            content: `Bem-vindo de volta, ${profile?.preferred_name || ''}! Vamos retomar de onde paramos.` 
          }
         ]);
         
         const localData = sessionStorage.getItem('alfred_onboarding');
         if (localData) {
            setOnboardingData(JSON.parse(localData));
         } else {
            setOnboardingData(profile);
         }
      } else {
         setMessages([
          { 
            role: 'assistant', 
            content: "Olá! Eu sou o Alfred, seu novo Chief of Staff digital. Para começarmos, como você prefere ser chamado?" 
          }
        ]);
      }
      setInitialized(true);
    };

    initDocs();
  }, [supabase, router, initialized]);

  const extractDataFromMessage = async (newMessages: ChatMessage[], session: any) => {
    const extractionPrompt = `Analise a conversa de onboarding e extraia APENAS os dados explicitamente fornecidos pelo usuário em formato JSON válido.
Nunca invente nomes de empresas, profissões ou valores. Se a informação não foi dita, deixe o campo como null.

BLOCO 1 (Apresentação): {"preferred_name": "..."}
BLOCO 2 (Profissão): {"profession": "...", "specialty": "...", "registration_number": "..."}
BLOCO 3 (Fiscal): {"document": "...", "company_name": "...", "state": "...", "tax_regime": "..."}
BLOCO 4 (Serviços): {"services": ["..."], "average_ticket": "...", "payment_terms": "..."}
BLOCO 5 (Perfil): {"client_profile": "...", "contract_tone": "...", "special_clauses": "..."}

Retorne APENAS um JSON mesclando tudo o que conseguir extrair até agora e indicando se o bloco atual terminou.
Formato exigido: 
{
    "data": { ...todos os campos encontrados },
    "isCurrentBlockComplete": true | false
}

O bloco atual da conversa que deve ser avaliado como concluído ou não é o BLOCO ${currentBlock}.
(Ex: Se estamos no BLOCO 1, e o usuário já disse o nome preferido, então isCurrentBlockComplete = true).`;

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: extractionPrompt,
          userId: session.user.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        }
      } else {
        const errorText = await response.text();
        console.error('Erro na extração de dados (AI):', response.status, errorText);
      }
    } catch (e) {
      console.error('Exceção ao extrair dados:', e);
    }
    return null;
  };

  const generateAndSaveAlfredContext = async (session: any, finalData: any) => {
    const generatePrompt = `Com base nas informações abaixo sobre o profissional, gere um alfred_context em texto corrido e estruturado que será usado como system prompt em todas as futuras interações. Inclua: nome preferido, profissão e especialidade, registro profissional, dados fiscais (documento, regime, estado), serviços e valores, perfil de clientes, tom de contratos e cláusulas especiais.

O texto deve ser escrito em primeira pessoa como se o Alfred já conhecesse profundamente o profissional. Seja específico — nunca use placeholders.
O alfred_context gerado deve ter entre 300 e 500 palavras.

Dados coletados:
${JSON.stringify(finalData, null, 2)}`;
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Dados finais coletados:', JSON.stringify(finalData, null, 2));
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          systemPrompt: generatePrompt,
          userId: session.user.id
        })
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Resposta da API /api/ai status:', response.status);
      }

      if (response.ok) {
        const data = await response.json();
        const alfredContext = data.choices[0].message.content;

        // Limpeza de dados — Garantindo tipos corretos para o Supabase
        const sanitizeNumeric = (val: any) => {
          if (!val) return null;
          // Se for string, remove tudo que não for número, vírgula ou ponto
          if (typeof val === 'string') {
            const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          }
          return typeof val === 'number' ? val : null;
        };

        const sanitizedData = {
          ...finalData,
          average_ticket: sanitizeNumeric(finalData.average_ticket),
          services: Array.isArray(finalData.services) 
            ? finalData.services 
            : typeof finalData.services === 'string' 
              ? finalData.services.split(',').map((s: string) => s.trim())
              : null
        };

        const { error } = await supabase
          .from('profiles')
          .update({
            preferred_name: sanitizedData.preferred_name || null,
            profession: sanitizedData.profession || null,
            specialty: sanitizedData.specialty || null,
            registration_number: sanitizedData.registration_number || null,
            document: sanitizedData.document || null,
            company_name: sanitizedData.company_name || null,
            state: sanitizedData.state || null,
            tax_regime: sanitizedData.tax_regime || null,
            services: sanitizedData.services || null,
            average_ticket: sanitizedData.average_ticket || null,
            payment_terms: sanitizedData.payment_terms || null,
            client_profile: sanitizedData.client_profile || null,
            contract_tone: sanitizedData.contract_tone || null,
            special_clauses: sanitizedData.special_clauses || null,
            alfred_context: alfredContext,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);

        if (error) {
           console.error('Erro ao atualizar profiles no Supabase:', error);
           throw error;
        }
        
        return true;
      } else {
        const errText = await response.text();
        console.error('Erro retornado pela API /api/ai:', errText);
      }
    } catch (e: any) {
      console.error('Error generating/saving context:', e);
      if (e instanceof Error) {
        console.error('Mensagem de erro:', e.message);
        console.error('Stack trace:', e.stack);
      }
    }
    return false;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg } as ChatMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const extractionResult = await extractDataFromMessage(newMessages, session);
      let updatedData = { ...onboardingData };
      let newBlock = currentBlock;
      
      if (extractionResult) {
        updatedData = { ...updatedData, ...extractionResult.data };
        setOnboardingData(updatedData);

        if (extractionResult.isCurrentBlockComplete && currentBlock < 6) {
          newBlock = currentBlock + 1;
          setCurrentBlock(newBlock);
          
          await supabase.from('profiles').update(extractionResult.data).eq('id', session.user.id);
          sessionStorage.setItem('alfred_onboarding', JSON.stringify(updatedData));
        }
      }

      if (newBlock === 6) {
         setMessages(prev => [...prev, { 
           role: 'assistant', 
           content: "Processando suas informações profissionais... Quase lá." 
         }]);
         
         const success = await generateAndSaveAlfredContext(session, updatedData);
         
         if (success) {
           const finalMsg = `Perfeito, ${updatedData.preferred_name || ''}! Aprendi tudo que preciso para ser seu Chief of Staff. Seu painel estratégico está pronto.`;
           setMessages(prev => [...prev.slice(0, -1), { 
             role: 'assistant', 
             content: finalMsg 
           }]);
           setTimeout(() => {
             router.push('/dashboard');
             router.refresh();
           }, 2000);
           return;
         } else {
           setMessages(prev => [...prev.slice(0, -1), { 
             role: 'assistant', 
             content: "Houve um problema ao salvar seu perfil. Tente novamente." 
           }]);
           setLoading(false);
           return;
         }
      }

      const systemPrompt = `Você é o Alfred, Chief of Staff digital de profissionais autônomos brasileiros. 
Você está conhecendo o profissional pela primeira vez para aprender sobre seu trabalho e agir em seu nome no futuro.

Seja direto, caloroso e profissional. Faça UMA pergunta por vez.
Quando o usuário responder, confirme brevemente o que entendeu e passe para a próxima pergunta do mesmo bloco.
Quando terminar um bloco, sinalize naturalmente a transição para o próximo tema.
Use linguagem natural em português brasileiro — nunca robótica.
Nunca liste as perguntas como formulário. Conduza uma conversa real.

Atualmente estamos no BLOCO ${newBlock} de 5.
BLOCO 1 - Apresentação (nome preferido).
BLOCO 2 - Profissão (profissão, especialidade, número de registro).
BLOCO 3 - Fiscal (CPF/CNPJ, nome da empresa se PJ, estado UF, regime tributário).
BLOCO 4 - Serviços (serviços oferecidos, valor médio cobrado, prazo típico, forma de pagamento preferida).
BLOCO 5 - Perfil de cliente (perfil típico, tom preferido nos contratos, cláusulas especiais).

Sempre confirme os dados fornecidos e continue com a próxima pergunta do bloco ${newBlock}.
Se terminar o bloco ${newBlock}, faça a transição naturalmente.`;

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Falha na chamada ao AI:', response.status, errorData);
        throw new Error(`Falha na chamada ao AI: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.choices[0].message.content;

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, tive um problema ao processar sua mensagem." }]);
    } finally {
      setLoading(false);
    }
  };

  const getDotClass = (dotVal: number) => {
    const isPast = dotVal < currentBlock;
    const isCurrent = dotVal === currentBlock;
    
    return `h-1.5 flex-1 rounded-full transition-all duration-500 ${
        isPast ? 'bg-[#1455CE]' : isCurrent ? 'bg-[#1455CE]/40 animate-pulse' : 'bg-neutral-100'
    }`;
  }

  return (
    <div className="min-h-screen bg-[#EFEFED] flex flex-col items-center justify-center md:p-10 font-body selection:bg-[#1455CE]/10 overflow-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-radial-at-tr from-[#1455CE]/5 via-transparent to-transparent opacity-50" />
      
      <div className="w-full max-w-[800px] h-screen md:h-[750px] flex flex-col bg-white md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-white overflow-hidden animate-[scaleIn_0.6s_ease-out]">
        
        {/* Header */}
        <div className="px-6 md:px-10 py-4 md:py-8 bg-white/50 backdrop-blur-md border-b border-neutral-50 flex items-center justify-between z-10 pt-safe">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-[16px] md:rounded-[22px] overflow-hidden shadow-2xl shadow-[#1455CE]/20 border-2 border-white bg-white shrink-0">
               <img 
                src="/images/alfred-avatar.png" 
                alt="Alfred" 
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-black text-xl md:text-3xl text-neutral-900 tracking-tighter leading-none">Alfred</span>
              <span className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 md:mt-2 flex items-center gap-2">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden xs:inline">Sincronizando Contexto Deep Intelligence</span>
                <span className="xs:hidden">Ativo</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 w-24 md:w-48">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div 
                key={dot}
                className={getDotClass(dot)}
              />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 md:py-8 flex flex-col gap-6 md:gap-8 scrollbar-hide pb-32 md:pb-8">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-[fadeIn_0.5s_ease-out]`}
            >
              <div className={`flex items-end gap-2 md:gap-3 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' ? (
                      <img 
                        src="/images/alfred-avatar.png" 
                        alt="Alfred" 
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <User size={14} className="md:size-4" />
                    )}
                <div 
                    className={`px-4 md:px-6 py-3 md:py-4 rounded-[20px] md:rounded-[24px] font-bold text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-[#1455CE] text-white rounded-br-none' 
                        : 'bg-neutral-50 text-neutral-800 rounded-bl-none border border-neutral-100'
                    }`}
                >
                    {msg.content}
                </div>
              </div>
              <span className="text-[8px] md:text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1.5 md:mt-2 mx-10 md:mx-11 leading-none">
                  {msg.role === 'assistant' ? 'Alfred' : 'Você'}
              </span>
            </div>
          ))}
          
          {loading && (
            <div className="flex flex-col items-start animate-pulse">
                <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-neutral-100 flex items-center justify-center overflow-hidden">
                        <img 
                          src="/images/alfred-avatar.png" 
                          alt="Alfred" 
                          className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="bg-neutral-50 border border-neutral-100 rounded-[24px] rounded-bl-none px-6 py-4 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#1455CE]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-[#1455CE]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-[#1455CE]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="fixed md:relative bottom-0 left-0 right-0 px-6 md:px-10 py-6 md:py-10 bg-white/80 md:bg-white/50 backdrop-blur-xl md:backdrop-blur-md border-t border-neutral-50 z-20 pb-safe-plus-6 md:pb-10">
          <div className="flex flex-row items-center gap-3 relative group">
            <div className="w-full relative">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                }}
                disabled={loading}
                placeholder="Resposta..."
                className="w-full bg-neutral-50 border border-neutral-100 rounded-[20px] md:rounded-[22px] py-4 md:py-5 pl-6 md:pl-8 pr-14 md:pr-16 outline-none text-neutral-900 font-bold text-base md:text-sm placeholder:text-neutral-400 focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] focus:bg-white transition-all shadow-inner"
                />
                <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-[16px] md:rounded-[18px] bg-[#1455CE] text-white disabled:opacity-50 transition-all shadow-lg shadow-[#1455CE]/20 hover:scale-105 active:scale-95 group-hover:rotate-6"
                >
                <Send className="w-5 h-5 size-4 md:size-5" />
                </button>
            </div>
          </div>
        </div>
        
      </div>

      <p className="hidden md:block mt-10 text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-40">
          Sua conversa é privada e criptografada • Alfred V2.4 Deep Intel
      </p>
    </div>
  );
}
