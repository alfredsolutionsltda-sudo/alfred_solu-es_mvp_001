"use client";

import { useState, useRef, useEffect } from "react";
import { X, Mail, Phone, Hash, MoreHorizontal, ArrowRight, CheckCircle2, XCircle, Clock, Send, AlertTriangle, User, FileText } from "lucide-react";
import { updateClientStatusAction } from "@/app/actions/clientActions";

import { ClientWithMetrics } from "@/types/clients";

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA';
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 45%)`;
}

function ScoreIndicator({ score }: { score: number }) {
  let color = 'bg-gray-300';
  let label = 'Desconhecido';
  if (score >= 80) { color = 'theme-green'; label = 'Excelente'; }
  else if (score >= 60) { color = 'theme-green-400'; label = 'Ótimo'; }
  else if (score >= 40) { color = 'theme-yellow'; label = 'Regular'; }
  else if (score >= 20) { color = 'theme-red-400'; label = 'Baixo'; }
  else { color = 'theme-red-600'; label = 'Crítico'; }
  
  // Custom colors to match tailwind equivalent standard since we can't use dynamic full class easily sometimes
  let hexColor = '#cbd5e1';
  if (score >= 80) hexColor = '#22c55e';
  else if (score >= 60) hexColor = '#4ade80';
  else if (score >= 40) hexColor = '#fbbf24';
  else if (score >= 20) hexColor = '#f87171';
  else hexColor = '#dc2626';

  return (
    <div className="flex items-center gap-3 bg-white border rounded-lg p-2 pr-4 shadow-sm w-fit mt-3">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
        style={{ backgroundColor: hexColor }}
      >
        {score}
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-900">{label}</div>
        <div className="text-[10px] text-gray-500">Score de Inadimplência</div>
      </div>
    </div>
  );
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function ClientDrawer({ 
  client, 
  onClose,
  onNewContract,
  onNewProposal
}: { 
  client: ClientWithMetrics | null;
  onClose: () => void;
  onNewContract?: () => void;
  onNewProposal?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'contratos' | 'alfred'>('visao_geral');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (client) {
      setActiveTab('visao_geral');
      setChatLog([]); // Reset chat when client changes
      // loadInitialAlfredMessage(); -- Removido a pedido para não iniciar chat automaticamente
    }
  }, [client]);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  async function loadInitialAlfredMessage() {
    if (!client) return;
    setIsTyping(true);
    try {
      const res = await fetch("/api/ai/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientData: client,
          message: "Analise o perfil deste cliente e gere uma mensagem de 2-3 linhas identificando o ponto mais importante de atenção ou oportunidade.",
          isInitial: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatLog([{ role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim() || !client) return;
    
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLog(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientData: client,
          message: userMsg,
          history: chatLog
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatLog(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatLog(prev => [...prev, { role: 'assistant', content: 'Desculpe, encontrei um erro ao processar sua solicitação.' }]);
      }
    } catch (e) {
      setChatLog(prev => [...prev, { role: 'assistant', content: 'Erro de conexão.' }]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleSendEmail(contract: any) {
    if (!client || !contract.slug || !client.email) {
      alert("Dados insuficientes para envio (e-mail ou link do contrato faltando).");
      return;
    }

    setIsSendingEmail(contract.id);
    try {
      const res = await fetch("/api/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: contract.id,
          slug: contract.slug,
          clientEmail: client.email,
          clientName: client.name,
          title: contract.title || "Contrato de Serviço"
        })
      });

      if (res.ok) {
        alert("E-mail enviado com sucesso via Resend!");
      } else {
        const data = await res.json();
        alert("Erro ao enviar e-mail: " + (data.error || "Erro desconhecido"));
      }
    } catch (e) {
      alert("Erro de conexão ao enviar e-mail.");
    } finally {
      setIsSendingEmail(null);
    }
  }

  if (!client) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
                style={{ backgroundColor: stringToColor(client.name) }}
              >
                {getInitials(client.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                  {client.status === 'ativo' && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Ativo</span>}
                  {client.status === 'inadimplente' && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Inadimplente</span>}
                  {client.status === 'inativo' && <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">Inativo</span>}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {client.notes?.split('\n')[0] || (client.type === 'pessoa_juridica' ? 'Empresa' : 'Pessoa Física')} 
                  {/* Mocked City */} · SP
                </p>
                <ScoreIndicator score={client.inadimplency_score} />
              </div>
            </div>
            
            <div className="flex items-center gap-2">

              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                    <button 
                      onClick={async () => {
                        if (confirm(`Tem certeza que deseja inativar o cliente ${client.name}?`)) {
                          const res = await updateClientStatusAction(client.user_id, client.id, 'inativo');
                          if (res.success) {
                            onClose();
                          } else {
                            alert("Erro ao inativar cliente: " + res.error);
                          }
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                    >
                      Inativar Cliente
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white border border-gray-100 rounded-lg p-3 text-center shadow-sm">
              <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Faturado</div>
              <div className="text-sm font-bold text-gray-900">{formatCurrency(client.total_billed)}</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-3 text-center shadow-sm">
              <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Pendente</div>
              <div className={`text-sm font-bold ${client.total_pending > 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(client.total_pending)}</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-3 text-center shadow-sm">
              <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Contratos</div>
              <div className="text-sm font-bold text-gray-900">{client.active_contracts}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex bg-gray-100/80 p-1 rounded-lg">
            {['Visão Geral', 'Contratos', 'Alfred'].map((tab) => {
              const tabId = tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(' ', '_') as any;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabId)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === tabId ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white shrink-0">
          {activeTab === 'visao_geral' && (
            <div className="space-y-6 pb-10">
              {/* Resumo Rápido */}
              <section className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Resumo do Perfil</h3>
                    <p className="text-xs text-gray-500">Informações básicas do cliente</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-2.5 rounded-lg border border-gray-50">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Tipo</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">{client.type?.replace('_', ' ') || 'Pessoa'}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-50">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Score</div>
                    <div className="text-sm font-medium text-gray-900">{client.inadimplency_score}/100</div>
                  </div>
                </div>
              </section>

              {/* Próximo Vencimento */}
              {client.next_due_date && (
                <section>
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Próximo Vencimento</h3>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-blue-900">Vencimento de Contrato</div>
                      <div className="text-xs text-blue-700 mt-0.5">{new Date(client.next_due_date).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Contato */}
              <section>
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Dados de Contato</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-gray-700">{client.email || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-gray-700">{client.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <span className="text-gray-700">{client.cpf_cnpj || 'Não cadastrado'}</span>
                  </div>
                </div>
              </section>

              {/* Histórico */}
              <section>
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex justify-between">
                  <span>Últimos Pagamentos</span>
                </h3>
                 {client.faturamento && client.faturamento.length > 0 ? (
                  <div className="space-y-3">
                    {/* Exibe apenas os 5 ultimos, ordenado por data idealmente */}
                    {(client.faturamento as any[]).slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          {f.status === 'pago' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : f.status === 'atrasado' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{f.description || 'Fatura'}</div>
                            <div className="text-xs text-gray-500">{new Date(f.due_date).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <div className="font-semibold text-sm text-gray-900">
                          {formatCurrency(Number(f.amount))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                    Nenhum histórico de pagamentos registrado.
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'contratos' && (
            <div className="space-y-4 pb-20">
              {client.contracts && client.contracts.length > 0 ? (
                (client.contracts as any[]).map(c => (
                  <div key={c.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{c.title || 'Contrato'}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'ativo' ? 'bg-green-100 text-green-700' : 
                        c.status === 'encerrado' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.status?.replace('_', ' ') || 'Pendente'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 mb-4">
                      <div className="text-xs text-gray-500">
                        Venc: <span className="font-medium text-gray-700">{c.end_date ? new Date(c.end_date).toLocaleDateString('pt-BR') : '-'}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(c.value) || 0)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <a 
                        href={`/contrato/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors border border-gray-100"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Abrir
                      </a>
                      <button 
                        onClick={() => handleSendEmail(c)}
                        disabled={isSendingEmail === c.id || !client.email}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingEmail === c.id ? (
                          <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {isSendingEmail === c.id ? 'Enviando...' : 'Enviar Email'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="text-gray-400 mb-2">📄</div>
                  <div className="text-sm text-gray-500">Este cliente ainda não possui contratos.</div>
                </div>
              )}
              
              <div className="mt-8 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => onNewContract?.()}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md shadow-gray-200"
                >
                  <FileText className="w-4 h-4" />
                  + Novo contrato para este cliente
                </button>
              </div>
            </div>
          )}

          {activeTab === 'alfred' && (
            <div className="h-full flex flex-col -m-6 bg-gray-50/30">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-gray-900 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-500 flex items-center gap-1 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={endOfChatRef} />
              </div>
              
              <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0 relative">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Pergunte sobre este cliente..."
                    className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-gray-300 outline-none"
                    disabled={isTyping}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim() || isTyping}
                    className="absolute right-2 p-1.5 bg-gray-900 text-white rounded-full disabled:bg-gray-400 transition-colors"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
