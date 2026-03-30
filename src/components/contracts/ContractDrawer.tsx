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
  Ban,
  TrendingUp,
  MessageSquare,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateContractStatusAction } from '@/app/actions/contractActions'

interface ContractDrawerProps {
  contract: ContractWithClient | null
  onClose: () => void
  isOpen: boolean
  mode?: 'contracts' | 'proposals'
}

type TabKey = 'contrato' | 'analise' | 'clausulas' | 'alfred' | 'negociacao' | 'followup'

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
    { key: 'contrato' as TabKey, label: isProposals ? 'Proposta' : 'Contrato', icon: FileText },
    ...(isProposals 
      ? [
          { key: 'negociacao' as TabKey, label: 'Negociar', icon: TrendingUp },
          { key: 'followup' as TabKey, label: 'Follow-up', icon: MessageSquare }
        ] 
      : []),
    { key: 'analise' as TabKey, label: 'Risco', icon: Shield },
    { key: 'clausulas' as TabKey, label: 'Cláusulas', icon: Hammer },
    { key: 'alfred' as TabKey, label: 'Alfred', icon: Bot },
  ]

  const [margin, setMargin] = useState(20)
  const [followupLoading, setFollowupLoading] = useState(false)
  const [followupMessage, setFollowupMessage] = useState('')

  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null)
  const [loadingRisk, setLoadingRisk] = useState(false)

  const [clauseExplanation, setClauseExplanation] = useState<{ index: number; text: string } | null>(null)
  const [loadingClause, setLoadingClause] = useState(false)

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

  const handleGenerateFollowup = async (tone: 'suave' | 'neutro' | 'firme') => {
    if (!contract) return
    setFollowupLoading(true)
    try {
      const waitTime = contract.created_at ? Math.floor((Date.now() - new Date(contract.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: contract.user_id,
          messages: [
            { 
              role: 'user', 
              content: `Gere um texto de follow-up para a proposta "${contract.title}" enviada para ${contract.client?.name}. O tom deve ser ${tone}. A proposta foi enviada há ${waitTime} dias. O valor é ${formatCurrency(contract.value)}.` 
            }
          ],
          systemPrompt: `Você é o Alfred. Crie uma mensagem de follow-up curta e eficaz para WhatsApp ou E-mail. 
          Suave: Lembrete gentil, focado em ajudar.
          Neutro: Profissional, perguntando se houve leitura.
          Firme: Focado em fechamento de agenda e validade da proposta.
          Responda APENAS com o texto da mensagem.`,
        }),
      })
      const data = await res.json()
      setFollowupMessage(data.choices?.[0]?.message?.content || '')
    } catch {
      alert('Erro ao gerar follow-up')
    } finally {
      setFollowupLoading(false)
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

  const handleAnalyzeRisk = async () => {
    if (!contract || loadingRisk) return
    setLoadingRisk(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: contract.user_id,
          messages: [
            { 
              role: 'user', 
              content: `Analise os riscos deste contrato: ${contract.contract_body?.substring(0, 3000)}. Identifique riscos financeiros, operacionais e jurídicos. Responda em tópicos curtos e objetivos.` 
            }
          ],
          systemPrompt: "Você é um especialista em análise de risco contratual. Identifique pontos de atenção, riscos de compliance e vantagens financeiras. Seja direto e use português brasileiro.",
        }),
      })
      const data = await res.json()
      setRiskAnalysis(data.choices?.[0]?.message?.content || 'Não foi possível analisar os riscos.')
    } catch {
      alert('Erro ao analisar os riscos.')
    } finally {
      setLoadingRisk(false)
    }
  }

  const handleExplainClause = async (clauseTitle: string, index: number) => {
    if (!contract || loadingClause) return
    setLoadingClause(true)
    setClauseExplanation({ index, text: '' })
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: contract.user_id,
          messages: [
            { 
              role: 'user', 
              content: `Explique de forma simples e didática o que significa a cláusula "${clauseTitle}" em um contrato de ${contract.service_type}. Use no máximo 3 frases.` 
            }
          ],
          systemPrompt: "Você é o Alfred, assistente jurídico. Explique cláusulas contratuais de forma simples para quem não é advogado.",
        }),
      })
      const data = await res.json()
      setClauseExplanation({ index, text: data.choices?.[0]?.message?.content || 'Não consegui explicar agora.' })
    } catch {
      alert('Erro ao explicar cláusula.')
    } finally {
      setLoadingClause(false)
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

          {/* Barra de assinatura (se assinado) - Movida para o topo para melhor visibilidade */}
          {contract.signed_at && (
            <div className="mb-6 p-4 md:p-5 border border-green-100 bg-green-50/50 rounded-[24px] shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-green-600/20">
                  <Verified className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">
                    Contrato Assinado
                  </p>
                  <p className="text-xs md:text-sm font-black text-neutral-900 tracking-tight leading-none mb-1 truncate">
                    {contract.signed_by_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] md:text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                    <span>{formatDate(contract.signed_at)}</span>
                    <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-neutral-200" />
                    <span className="truncate">IP: {contract.signed_by_ip || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            {contract.status === 'vencendo' && (
              <button 
                onClick={() => alert('Funcionalidade de renovação será aberta em breve!')}
                className="flex-[1.5] flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-amber-500 text-white hover:bg-amber-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all no-print shadow-lg shadow-amber-500/10"
              >
                <RefreshCcw size={12} className="md:size-3.5 stroke-[3px]" />
                Renovar
              </button>
            )}
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
              
              {/* Estatísticas de Leitura (se houver) */}
              {isProposals && contract.read_at && (
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 p-5 rounded-[24px] border border-neutral-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-neutral-400">Primeira Leitura</p>
                      <p className="text-xs font-black text-neutral-900">{formatDate(contract.read_at)}</p>
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-5 rounded-[24px] border border-neutral-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1455CE]/5 flex items-center justify-center text-[#1455CE]">
                      <History size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-neutral-400">Tempo de Leitura</p>
                      <p className="text-xs font-black text-neutral-900">
                        {Math.floor((contract.total_reading_time || 0) / 60)} min {(contract.total_reading_time || 0) % 60}s
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'negociacao' && (
            <div className="p-6 md:p-10 md:pt-8 space-y-6 md:space-y-8 pb-24 md:pb-10 animate-in fade-in duration-500">
              <div className="bg-white border border-neutral-100 rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingUp className="text-[#1455CE]" size={16} />
                  Simulador de Margem
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Margem de Segurança (%)</span>
                      <span className="text-sm font-black text-[#1455CE]">{margin}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      value={margin} 
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-[#1455CE]"
                    />
                  </div>
                  
                  <div className="h-px bg-neutral-50" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-neutral-50 rounded-[24px] border border-neutral-100">
                      <p className="text-[8px] font-black text-neutral-400 uppercase mb-1">Custo Estimado</p>
                      <p className="text-lg font-black text-neutral-900">{formatCurrency((contract.value || 0) * 0.4)}</p>
                    </div>
                    <div className="p-5 bg-[#1455CE]/5 rounded-[24px] border border-[#1455CE]/10">
                      <p className="text-[8px] font-black text-[#1455CE] uppercase mb-1">Lucro Projetado</p>
                      <p className="text-lg font-black text-[#1455CE]">
                        {formatCurrency((contract.value || 0) * (margin/100))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-green-50/50 border border-green-100 rounded-[28px] text-center">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Preço de Equilíbrio Recomentado</p>
                    <p className="text-3xl font-headline font-black text-green-700 tracking-tighter">
                      {formatCurrency((contract.value || 0) * (1 + margin/200))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followup' && (
            <div className="p-6 md:p-10 md:pt-8 bg-neutral-50/50 flex flex-col h-full overflow-hidden">
               <div className="mb-6">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare className="text-[#1455CE]" size={16} />
                  Alfred Follow-up
                </h3>
                <p className="text-xs text-neutral-500 font-bold leading-relaxed">
                  Escolha o tom para que o Alfred gere uma mensagem personalizada de acompanhamento.
                </p>
               </div>

               <div className="grid grid-cols-3 gap-3 mb-6">
                  {['suave', 'neutro', 'firme'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleGenerateFollowup(t as any)}
                      disabled={followupLoading}
                      className="py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-neutral-200 hover:border-[#1455CE] hover:text-[#1455CE] transition-all active:scale-95 disabled:opacity-50"
                    >
                      {t}
                    </button>
                  ))}
               </div>

               <div className="flex-1 bg-white rounded-[32px] border border-neutral-100 p-8 shadow-inner overflow-y-auto relative min-h-[200px]">
                  {followupLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[32px] z-10">
                      <Loader2 className="animate-spin text-[#1455CE]" size={32} />
                    </div>
                  ) : followupMessage ? (
                    <div className="animate-in fade-in duration-500">
                      <p className="text-sm font-bold text-neutral-700 leading-relaxed italic">"{followupMessage}"</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(followupMessage)
                          alert('Copiado!')
                        }}
                        className="mt-6 flex items-center gap-2 text-[10px] font-black text-[#1455CE] uppercase tracking-widest hover:underline"
                      >
                        Copiar Mensagem
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30">
                       <Bot size={40} className="mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mensagem gerada</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'analise' && (
            <div className="p-6 md:p-10 md:pt-8 space-y-6 md:space-y-8 pb-24 md:pb-10 animate-in fade-in duration-500">
               <div className="bg-[#1455CE]/5 rounded-[32px] p-8 border border-[#1455CE]/10 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#1455CE]/5 rounded-full blur-2xl" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="text-[#1455CE] w-5 h-5" />
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">
                      Análise de Risco Alfred
                    </h3>
                  </div>
                  {!riskAnalysis && !loadingRisk && (
                    <button 
                      onClick={handleAnalyzeRisk}
                      className="px-4 py-2 bg-[#1455CE] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#114ab3] transition-all shadow-lg shadow-[#1455CE]/10 active:scale-95 flex items-center gap-2"
                    >
                      <Bot size={14} />
                      Analisar Agora
                    </button>
                  )}
                </div>

                {loadingRisk ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="animate-spin text-[#1455CE] mb-4" size={32} />
                    <p className="text-xs font-bold text-neutral-500">O Alfred está lendo as cláusulas e identificando riscos...</p>
                  </div>
                ) : riskAnalysis ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                     <div className="prose prose-sm prose-neutral max-w-none text-neutral-700 font-bold leading-relaxed whitespace-pre-wrap">
                        {riskAnalysis}
                     </div>
                     <button 
                        onClick={() => setRiskAnalysis(null)}
                        className="text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors"
                     >
                       Nova Análise
                     </button>
                  </div>
                ) : (
                  <div className="py-6">
                    <p className="text-xs text-neutral-500 font-bold leading-relaxed mb-6">
                      Clique no botão acima para que o Alfred faça uma varredura completa nas cláusulas operacionais e jurídicas {isProposals ? 'desta proposta' : 'deste contrato'}.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 opacity-40 grayscale">
                      <div className="p-4 bg-white/50 rounded-2xl border border-neutral-100 flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={16} />
                        <div>
                          <p className="text-[10px] font-black text-neutral-900 uppercase">Compliance</p>
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full mt-1" />
                        </div>
                      </div>
                      <div className="p-4 bg-white/50 rounded-2xl border border-neutral-100 flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" size={16} />
                        <div>
                          <p className="text-[10px] font-black text-neutral-900 uppercase">Financeiro</p>
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-neutral-50 rounded-[28px] border border-neutral-100/50 text-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Segurança Estimada</p>
                  <p className="text-3xl font-headline font-black text-green-600 transition-transform group-hover:scale-110 tracking-tight">Alta</p>
                </div>
                <div className="p-6 bg-neutral-50 rounded-[28px] border border-neutral-100/50 text-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Projeção de Retenção</p>
                  <p className="text-3xl font-headline font-black text-[#1455CE] transition-transform group-hover:scale-110 tracking-tight">85%</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clausulas' && (
            <div className="p-6 md:p-10 md:pt-8 pb-24 md:pb-10">
              <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 md:mb-6 ml-1">
                Cláusulas Inteligentes
              </p>
              <div className="space-y-3 md:space-y-4">
                {[
                  'Qualificação das Partes',
                  `Objeto ${isProposals ? "da Proposta" : "do Contrato"}`,
                  'Valor e Pagamento',
                  'Prazo e Vigência',
                  'Obrigações do Contratante',
                  'Rescisão Antecipada',
                  'Foro e Eleição',
                ].map((clausula, i) => (
                  <div key={i} className="space-y-2">
                    <div
                      onClick={() => handleExplainClause(clausula, i)}
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all cursor-pointer group ${
                        clauseExplanation?.index === i 
                          ? 'bg-[#1455CE]/5 border-[#1455CE]/20' 
                          : 'hover:bg-neutral-50 border-transparent hover:border-neutral-100'
                      }`}
                    >
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        clauseExplanation?.index === i ? 'bg-[#1455CE] text-white' : 'bg-[#1455CE]/10 text-[#1455CE] group-hover:bg-[#1455CE] group-hover:text-white'
                      }`}>
                        <span className="text-[9px] md:text-[10px] font-black">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs md:text-sm text-neutral-700 font-bold group-hover:text-neutral-900 transition-colors flex-1">
                        {clausula}
                      </span>
                      {loadingClause && clauseExplanation?.index === i ? (
                        <Loader2 className="animate-spin text-[#1455CE]" size={14} />
                      ) : (
                        <Bot size={14} className="text-neutral-200 group-hover:text-[#1455CE] transition-colors" />
                      )}
                    </div>
                    
                    {clauseExplanation && clauseExplanation.index === i && (
                      <div className="mx-4 md:mx-6 p-4 bg-white border border-[#1455CE]/10 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200">
                        <p className="text-xs font-bold text-neutral-600 leading-relaxed italic">
                          {clauseExplanation.text || 'Alfred está pensando...'}
                        </p>
                      </div>
                    )}
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

        {/* Espaçador para o rodapé (opcional) */}
      </div>
    </>
  )
}
