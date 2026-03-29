'use client'

import { useState, useRef, useEffect } from 'react'
import type { ContractWithClient } from '@/types/contracts'
import { 
  X, 
  FileText, 
  Shield, 
  Hammer, 
  Bot, 
  Check, 
  Link, 
  Download, 
  RefreshCcw, 
  Mail, 
  Send, 
  Verified, 
  CheckCircle, 
  Circle,
  AlertTriangle,
  History,
  Printer,
  Share2,
  Loader2,
  MoreHorizontal,
  Trash2,
  Ban
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateContractStatusAction } from '@/app/actions/contractActions'

interface ContractDrawerProps {
  contract: ContractWithClient | null
  onClose: () => void
  isOpen: boolean
  mode?: 'contracts' | 'proposals'
}

type TabKey = 'contrato' | 'analise' | 'clausulas' | 'alfred'

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ativo: { label: 'Ativo', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  vencendo: { label: 'Vencendo', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  pendente_assinatura: { label: 'Pendente', bg: 'bg-neutral-50', text: 'text-neutral-500', dot: 'bg-neutral-300' },
  expirado: { label: 'Expirado', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  rascunho: { label: 'Rascunho', bg: 'bg-neutral-50', text: 'text-neutral-400', dot: 'bg-neutral-300' },
  enviado: { label: 'Enviado', bg: 'bg-blue-50', text: 'text-[#1455CE]', dot: 'bg-[#1455CE]' },
  assinado: { label: 'Assinado', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  encerrado: { label: 'Encerrado', bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
}

function formatCurrency(value: number | null) {
  if (!value) return 'R$ 0'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function ContractDrawer({
  contract,
  onClose,
  isOpen,
  mode = 'contracts',
}: ContractDrawerProps) {
  const isProposals = mode === 'proposals'
  const [activeTab, setActiveTab] = useState<TabKey>('contrato')
  const [copied, setCopied] = useState(false)
  const [alfredMessages, setAlfredMessages] = useState<
    { role: 'assistant' | 'user'; content: string }[]
  >([])
  const [alfredInput, setAlfredInput] = useState('')
  const [alfredLoading, setAlfredLoading] = useState(false)
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isInactivating, setIsInactivating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'contrato', label: isProposals ? 'Proposta' : 'Contrato', icon: FileText },
    { key: 'analise', label: 'Risco', icon: Shield },
    { key: 'clausulas', label: 'Cláusulas', icon: Hammer },
    { key: 'alfred', label: 'Alfred', icon: Bot },
  ]

  const [sendingEmail, setSendingEmail] = useState(false)

  // Reseta as mensagens do Alfred ao mudar de contrato
  useEffect(() => {
    if (contract) {
      setActiveTab('contrato')
      setAlfredMessages([
        {
          role: 'assistant',
          content: `Olá! Estou analisando ${isProposals ? 'a proposta' : 'o contrato'} "${contract.title}" com ${contract.client?.name || 'o cliente'}. O valor é de ${formatCurrency(contract.value)} e o status atual é "${contract.status}". Como posso ajudar?`,
        },
      ])
    }
  }, [contract?.id])

  const handleCopyLink = () => {
    if (!contract?.slug) return
    const url = `${window.location.origin}/contrato/${contract.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    if (!contract) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          slug: contract.slug,
          clientEmail: contract.client?.email,
          clientName: contract.client?.name,
          title: contract.title,
        }),
      })

      if (res.ok) {
        alert('E-mail enviado com sucesso!')
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao enviar e-mail.')
      }
    } catch {
      alert('Erro de conexão ao enviar e-mail.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleInactivate = async () => {
    if (!contract || !contract.user_id) return
    
    if (confirm(`Tem certeza que deseja inativar ${isProposals ? 'esta proposta' : 'este contrato'}?`)) {
      setIsInactivating(true)
      try {
        const res = await updateContractStatusAction(contract.user_id, contract.id, 'encerrado')
        if (res.success) {
          setIsMenuOpen(false)
          router.refresh()
          onClose()
        } else {
          alert('Erro ao inativar: ' + res.error)
        }
      } catch (error) {
        alert('Erro de conexão ao inativar.')
      } finally {
        setIsInactivating(false)
      }
    }
  }

  const handleAlfredSubmit = async () => {
    if (!alfredInput.trim() || !contract) return

    const userMsg = alfredInput.trim()
    setAlfredInput('')
    setAlfredMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setAlfredLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: contract.user_id,
          messages: [
            ...alfredMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMsg },
          ],
          systemPrompt: `Você é o Alfred, assistente jurídico. Está analisando ${isProposals ? 'a proposta' : 'o contrato'} "${contract.title}" com o cliente ${contract.client?.name || 'não informado'}. Valor: ${formatCurrency(contract.value)}. Status: ${contract.status}. Período: ${contract.start_date || '?'} a ${contract.end_date || '?'}. Texto ${isProposals ? 'da proposta' : 'do contrato'}: ${contract.contract_body?.substring(0, 2000) || 'Não disponível'}. Responda de forma objetiva e útil sobre ${isProposals ? 'esta proposta específica' : 'este contrato específico'}.`,
        }),
      })

      const data = await res.json()
      const assistantMsg =
        data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar.'
      setAlfredMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMsg },
      ])
    } catch {
      setAlfredMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ocorreu um erro ao processar. Tente novamente.',
        },
      ])
    } finally {
      setAlfredLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [alfredMessages])

  if (!contract) return null

  const status = statusConfig[contract.status] || statusConfig['rascunho']

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-neutral-900/40 backdrop-blur-[6px] z-40 transition-opacity duration-300 no-print ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:max-w-[520px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.15)] z-50 transform transition-transform duration-500 ease-out flex flex-col print-content md:rounded-l-[40px] border-l border-white/20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full shadow-none border-none'
        }`}
      >
        {/* Header */}
        <div className="p-6 md:p-10 md:pb-8 border-b border-neutral-100 shrink-0 bg-neutral-50/50 md:rounded-tl-[40px]">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h2 className="text-xl md:text-2xl font-headline font-black text-neutral-900 tracking-tighter truncate max-w-full">
                  {contract.client?.name || 'Cliente'}
                </h2>
                <span
                  className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-black/5 ${status.bg} ${status.text} whitespace-nowrap`}
                >
                   <span className={`inline-block w-1 md:w-1.5 h-1 md:h-1.5 rounded-full mr-1 md:mr-1.5 ${status.dot} animate-pulse`} />
                  {status.label}
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-neutral-400 tracking-tight truncate">{contract.service_type || contract.title}</p>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl transition-all text-neutral-400 hover:text-neutral-900 no-print"
                >
                  <MoreHorizontal size={18} className="md:size-5" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={handleInactivate}
                      disabled={isInactivating}
                      className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isInactivating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Ban size={14} className="stroke-[3px]" />
                      )}
                      {isProposals ? 'Inativar Proposta' : 'Inativar Contrato'}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl transition-all text-neutral-400 hover:text-neutral-900 no-print"
              >
                <X size={18} className="md:size-5" />
              </button>
            </div>
          </div>

          {/* Valor em destaque */}
          <div className="bg-white border border-neutral-100 rounded-[24px] p-5 md:p-6 flex flex-row items-center justify-between mb-6 md:mb-8 shadow-sm">
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">
                Valor Total
              </p>
              <p className="text-xl md:text-3xl font-headline font-black text-[#1455CE] tracking-tighter">
                {formatCurrency(contract.value)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">
                Vencimento
              </p>
              <p className="text-[10px] md:text-xs font-black text-neutral-900 uppercase">
                {formatDate(contract.end_date)}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={handleCopyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                copied
                  ? 'bg-green-50 text-green-600 border border-green-100'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:shadow-md hover:text-neutral-900'
              }`}
            >
              {copied ? <Check size={12} className="md:size-3.5 stroke-[3px]" /> : <Link size={12} className="md:size-3.5 stroke-[3px]" />}
              <span className="truncate">{copied ? 'Copiado!' : 'Link'}</span>
            </button>
            <button 
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:shadow-md text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all no-print shadow-sm"
            >
              <Download size={12} className="md:size-3.5 stroke-[3px]" />
              PDF
            </button>
            <button 
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-[#1455CE] text-white hover:bg-[#114ab3] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all no-print disabled:opacity-50 shadow-lg shadow-[#1455CE]/10"
            >
              {sendingEmail ? <Loader2 size={12} className="md:size-3.5 animate-spin" /> : <Mail size={12} className="md:size-3.5 stroke-[3px]" />}
              {sendingEmail ? '...' : 'Enviar'}
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex px-4 md:px-10 border-b border-neutral-100 shrink-0 no-print bg-neutral-50/50 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 md:gap-2 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'text-[#1455CE] border-[#1455CE]'
                    : 'text-neutral-400 border-transparent hover:text-neutral-600'
                }`}
              >
                <Icon size={12} className={activeTab === tab.key ? 'md:size-3.5 stroke-[3px]' : 'md:size-3.5 stroke-[2px]'} />
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Conteúdo da aba */}
        <div className="flex-1 overflow-y-auto bg-white">
          {activeTab === 'contrato' && (
            <div className="p-6 md:p-10 md:pt-8 no-print pb-24 md:pb-10">
               <div className="relative group">
                <div className="absolute -top-2.5 md:-top-3 left-4 md:left-6 px-2 md:px-3 py-1 bg-[#1455CE] text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg z-10 transition-transform group-hover:scale-105">
                  Visualização Digital
                </div>
                <div className="bg-neutral-50 rounded-[24px] md:rounded-[32px] p-6 md:p-8 pt-8 md:pt-10 text-sm md:text-base text-neutral-700 leading-relaxed md:leading-[1.8] whitespace-pre-wrap font-medium border border-neutral-100 shadow-inner min-h-[300px] md:min-h-[400px]">
                  {contract.contract_body || (isProposals ? 'Texto da proposta não disponível.' : 'Texto do contrato não disponível.')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analise' && (
            <div className="p-6 md:p-10 md:pt-8 space-y-6 md:space-y-8 pb-24 md:pb-10">
              <div className="bg-[#1455CE]/5 rounded-[24px] p-5 md:p-6 border border-[#1455CE]/10">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="text-[#1455CE] w-[18px] h-[18px] md:w-5 md:h-5" />
                  <h3 className="text-[11px] md:text-sm font-black text-neutral-900 uppercase tracking-widest">
                    Análise Preditiva
                  </h3>
                </div>
                <p className="text-[10px] md:text-xs text-neutral-500 font-bold leading-relaxed mb-6">
                  O Alfred analisou os principais riscos operacionais e jurídicos {isProposals ? 'desta proposta' : 'deste contrato'}.
                </p>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-neutral-100 shadow-sm flex items-start gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <CheckCircle className="text-green-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-black text-neutral-900 uppercase tracking-tight">Compliance</p>
                      <p className="text-[9px] md:text-[10px] text-neutral-400 font-bold mt-1 leading-normal">O contrato segue as normas vigentes de proteção de dados.</p>
                    </div>
                  </div>
                  <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-neutral-100 shadow-sm flex items-start gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="text-amber-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-black text-neutral-900 uppercase tracking-tight">Vantagem Financeira</p>
                      <p className="text-[9px] md:text-[10px] text-neutral-400 font-bold mt-1 leading-normal">A multa por atraso está abaixo da média do mercado para este setor.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-4 bg-neutral-50 rounded-[20px] text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase mb-2">Segurança</p>
                  <p className="text-xl md:text-2xl font-headline font-black text-green-600">Alta</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-[20px] text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase mb-2">Retenção</p>
                  <p className="text-xl md:text-2xl font-headline font-black text-[#1455CE]">85%</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clausulas' && (
            <div className="p-6 md:p-10 md:pt-8 pb-24 md:pb-10">
              <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 md:mb-6 ml-1">
                Cláusulas Inteligentes
              </p>
              <div className="space-y-2 md:space-y-3">
                {[
                  'Qualificação das Partes',
                  `Objeto ${isProposals ? "da Proposta" : "do Contrato"}`,
                  'Valor e Pagamento',
                  'Prazo e Vigência',
                  'Obrigações do Contratante',
                  'Rescisão Antecipada',
                  'Foro e Eleição',
                ].map((clausula, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-neutral-50 border border-transparent hover:border-neutral-100 transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-[#1455CE]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1455CE] transition-colors">
                      <span className="text-[9px] md:text-[10px] font-black text-[#1455CE] group-hover:text-white">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs md:text-sm text-neutral-700 font-bold group-hover:text-neutral-900 transition-colors">
                      {clausula}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alfred' && (
            <div className="flex flex-col h-full bg-[#F4F4F2]/50">
              <div className="flex-1 p-5 md:p-8 space-y-4 md:space-y-6 overflow-y-auto pb-28 md:pb-8">
                {alfredMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] md:max-w-[85%] px-4 py-3 md:px-5 md:py-4 rounded-[20px] md:rounded-[24px] text-xs md:text-sm font-bold shadow-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#1455CE] text-white rounded-br-none'
                          : 'bg-white text-neutral-800 rounded-bl-none border border-neutral-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {alfredLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-[20px] md:rounded-[24px] rounded-bl-none border border-neutral-100 shadow-sm">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#1455CE] rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#1455CE] rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#1455CE] rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="fixed md:sticky bottom-0 left-0 right-0 p-4 md:p-8 md:pt-4 bg-white border-t border-neutral-100 no-print z-10 w-full">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAlfredSubmit()
                  }}
                  className="relative group"
                >
                  <input
                    type="text"
                    value={alfredInput}
                    onChange={(e) => setAlfredInput(e.target.value)}
                    placeholder={isProposals ? "Tire dúvidas..." : "Tire dúvidas..."}
                    className="w-full px-5 py-3.5 md:px-6 md:py-4 rounded-xl md:rounded-[20px] border border-neutral-200 text-[16px] md:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] bg-neutral-50/50 transition-all pr-12 md:pr-14"
                  />
                  <button
                    type="submit"
                    disabled={alfredLoading || !alfredInput.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-[#1455CE] text-white rounded-lg md:rounded-xl hover:bg-[#114ab3] transition-all disabled:opacity-40 disabled:scale-100 active:scale-90 shadow-lg shadow-[#1455CE]/10"
                  >
                    <Send size={16} className="md:size-[18px] stroke-[2.5px]" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Barra de assinatura no rodapé (se assinado) */}
        {contract.signed_at && (
          <div className="p-5 md:p-8 border-t border-neutral-100 bg-green-50/70 shrink-0 no-print">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-green-500/20 flex items-center justify-center shrink-0">
                <Verified className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-black text-neutral-900 tracking-tight leading-none mb-1 truncate">
                   {contract.signed_by_name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] md:text-[10px] font-bold text-green-700 uppercase tracking-widest opacity-80">
                  <span className="whitespace-nowrap">Assinado em {formatDate(contract.signed_at)}</span>
                  <span className="hidden xs:inline w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-green-300" />
                  <span className="whitespace-nowrap truncate">IP: {contract.signed_by_ip || '---'}</span>
                </div>
              </div>
              <div className="px-2 py-0.5 md:px-3 md:py-1 bg-green-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg shrink-0">
                Válido
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
