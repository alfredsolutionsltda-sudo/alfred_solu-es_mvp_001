'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Bot, RefreshCcw, Save, CheckCircle, Loader2, Search, User, ChevronRight } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  cpf_cnpj: string | null
}

interface NewContractModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  clients: Client[]
  onContractCreated: (contract: { id: string; slug: string }) => void
  mode?: 'contracts' | 'proposals'
}

export default function NewContractModal({
  isOpen,
  onClose,
  userId,
  clients,
  onContractCreated,
  mode = 'contracts',
}: NewContractModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  // Passo 1 — dados
  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [value, setValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const clientInputRef = useRef<HTMLInputElement>(null)

  // Passo 2 — contrato gerado
  const [contractText, setContractText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Toast
  const [toast, setToast] = useState('')

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setClientName('')
        setClientId('')
        setClientEmail('')
        setServiceType('')
        setValue('')
        setStartDate('')
        setEndDate('')
        setPaymentTerms('')
        setContractText('')
        setGenerating(false)
        setSaving(false)
        setError('')
      }, 300)
    }
  }, [isOpen])

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientName.toLowerCase())
  )

  const handleSelectClient = (client: Client) => {
    setClientName(client.name)
    setClientId(client.id)
    setClientEmail(client.email || '')
    setShowClientSuggestions(false)
  }

  const handleGenerateContract = async () => {
    setError('')
    setGenerating(true)

    try {
      const res = await fetch('/api/ai/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          description: `Contrato de ${serviceType}`,
          clientName,
          serviceType,
          value: parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')),
          startDate,
          endDate,
          paymentTerms,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao gerar contrato')
        return
      }

      setContractText(data.contractText)
      setStep(2)
    } catch {
      setError('Erro de conexão ao gerar contrato')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveContract = async () => {
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clientName,
          clientId: clientId || undefined,
          clientEmail: clientEmail || undefined,
          serviceType,
          value: parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')),
          startDate,
          endDate,
          paymentTerms,
          contractBody: contractText,
          title: mode === 'proposals' ? `Proposta - ${serviceType}` : `Contrato - ${serviceType}`,
          description: mode === 'proposals' 
            ? `Proposta comercial: ${serviceType}` 
            : `Prestação de serviços: ${serviceType}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao salvar contrato')
        return
      }

      // Copia link para clipboard
      const slug = data.contract?.slug
      if (slug) {
        const url = `${window.location.origin}/contrato/${slug}`
        await navigator.clipboard.writeText(url).catch(() => {})
      }

      setToast(mode === 'proposals' 
        ? 'Proposta criada. Link copiado para a área de transferência.' 
        : 'Contrato criado. Link copiado para a área de transferência.')
      setTimeout(() => setToast(''), 4000)

      onContractCreated(data.contract)
      onClose()
      router.refresh()
    } catch {
      setError('Erro de conexão ao salvar contrato')
    } finally {
      setSaving(false)
    }
  }

  const canGenerate =
    clientName && serviceType && value && startDate && endDate

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[6px] z-50 flex items-center justify-center md:p-4"
        onClick={onClose}
      >
        <div
          className="bg-white md:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-[720px] h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out] border-x md:border border-neutral-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-6 md:px-10 md:py-8 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
            <div className="space-y-1 pr-4">
              <h2 className="text-xl md:text-3xl font-headline font-black text-neutral-900 tracking-tighter line-clamp-1">
                {step === 1 
                  ? (mode === 'proposals' ? 'Nova Proposta' : 'Novo Contrato') 
                  : (mode === 'proposals' ? 'Proposta Gerada' : 'Contrato Gerado')}
              </h2>
              <p className="text-neutral-500 font-bold text-[10px] md:text-sm tracking-tight leading-tight">
                {step === 1
                  ? (mode === 'proposals' 
                      ? 'O Alfred utiliza IA para redigir suas propostas em segundos.' 
                      : 'O Alfred utiliza IA para redigir seus contratos em segundos.')
                  : 'Revise o texto gerado e aplique ajustes finais.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl md:rounded-2xl transition-all text-neutral-400 hover:text-neutral-900"
            >
              <X size={20} className="md:size-6" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8">
            {step === 1 && (
              <div className="space-y-5 md:space-y-6">
                {/* Cliente */}
                <div className="relative">
                  <label htmlFor="contract-client" className="block text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
                    {mode === 'proposals' ? 'Cliente da Proposta' : 'Cliente do Contrato'}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#1455CE] transition-colors">
                      <User size={16} className="md:size-[18px]" />
                    </div>
                    <input
                      id="contract-client"
                      ref={clientInputRef}
                      type="text"
                      required
                      aria-required="true"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value)
                        setClientId('')
                        setShowClientSuggestions(true)
                      }}
                      onFocus={() => setShowClientSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowClientSuggestions(false), 200)
                      }
                      placeholder="Nome completo ou razão social..."
                      className="w-full pl-10 md:pl-12 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-neutral-50/30"
                    />
                  </div>
                  {showClientSuggestions &&
                    clientName &&
                    filteredClients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-100 rounded-[20px] shadow-xl z-20 max-h-56 overflow-y-auto p-2">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => handleSelectClient(client)}
                            className="w-full text-left px-4 py-3 hover:bg-[#1455CE]/5 rounded-xl transition-all group"
                          >
                            <p className="font-bold text-neutral-900 group-hover:text-[#1455CE] text-sm md:text-base">
                              {client.name}
                            </p>
                            {client.email && (
                              <p className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                                {client.email}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {/* Tipo de serviço */}
                  <div className="md:col-span-2">
                    <label htmlFor="contract-service" className="block text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
                      {mode === 'proposals' ? 'Objeto da Proposta' : 'Objeto do Contrato'}
                    </label>
                    <input
                      id="contract-service"
                      type="text"
                      required
                      aria-required="true"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      placeholder="Ex: Consultoria de Marketing Mensal..."
                      className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-neutral-50/30"
                    />
                  </div>

                  {/* Valor */}
                  <div>
                    <label htmlFor="contract-value" className="block text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
                      Valor Total (R$)
                    </label>
                    <input
                      id="contract-value"
                      type="text"
                      required
                      aria-required="true"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-neutral-50/30"
                    />
                  </div>

                  {/* Forma de pagamento */}
                  <div>
                    <label htmlFor="contract-payment" className="block text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
                      Fluxo de Pagamento
                    </label>
                    <div className="relative">
                      <select
                        id="contract-payment"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-neutral-50/30 cursor-pointer appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Pagamento mensal via boleto bancário">Mensal - Boleto</option>
                        <option value="Pagamento mensal via PIX">Mensal - PIX</option>
                        <option value="Pagamento único via transferência bancária">Único - Transferência</option>
                        <option value="Pagamento em parcelas via boleto bancário">Parcelado - Boleto</option>
                        <option value="A combinar entre as partes">A combinar</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        <ChevronRight className="rotate-90" size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  <div>
                    <label htmlFor="contract-start" className="block text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
                      Início da Vigência
                    </label>
                    <input
                      id="contract-start"
                      type="date"
                      required
                      aria-required="true"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-neutral-50/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="contract-end" className="block text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
                      Término / Expiração
                    </label>
                    <input
                      id="contract-end"
                      type="date"
                      required
                      aria-required="true"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-neutral-50/30"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold text-red-600 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="relative">
                   <textarea
                    id="contract-text"
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    aria-label="Conteúdo do contrato"
                    className="w-full min-h-[350px] md:min-h-[440px] px-6 md:px-8 py-6 md:py-8 rounded-[20px] md:rounded-[24px] border border-neutral-200 text-xs md:text-sm font-medium text-neutral-700 leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] resize-none bg-neutral-50 shadow-inner"
                    placeholder="O texto do contrato aparecerá aqui..."
                  />
                  <div className="absolute top-4 right-4 px-2 md:px-3 py-1 bg-white/80 backdrop-blur rounded-lg border border-neutral-100 text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Editor Alfred
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold text-red-600 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-6 md:px-10 md:py-8 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 bg-neutral-50/30">
            {step === 1 ? (
              <>
                <button
                  onClick={onClose}
                  className="w-full md:w-auto px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors order-2 md:order-1"
                >
                  Descartar
                </button>
                <button
                  onClick={handleGenerateContract}
                  disabled={!canGenerate || generating}
                  className="w-full md:w-auto px-8 md:px-10 py-4 md:py-4.5 rounded-xl md:rounded-[20px] text-[10px] md:text-sm font-black bg-[#1455CE] text-white hover:bg-[#114ab3] transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl shadow-[#1455CE]/20 active:scale-95 uppercase tracking-widest order-1 md:order-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 md:w-[18px] md:h-[18px]" />
                      Redigindo...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 md:w-[18px] md:h-[18px] stroke-[2.5px]" />
                      {mode === 'proposals' ? 'Gerar Proposta' : 'Gerar Contrato'}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex gap-3 md:gap-4 w-full md:w-auto order-2 md:order-1">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 md:flex-none px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors border border-transparent hover:border-neutral-200"
                  >
                    Dados
                  </button>
                  <button
                    onClick={handleGenerateContract}
                    disabled={generating}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:shadow-md transition-all text-[10px] md:text-sm font-bold disabled:opacity-40"
                  >
                    {generating ? (
                      <Loader2 className="animate-spin w-3.5 h-3.5 md:w-4 md:h-4" />
                    ) : (
                      <RefreshCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                    Regenerar
                  </button>
                </div>
                <button
                  onClick={handleSaveContract}
                  disabled={saving || !contractText}
                  className="w-full md:w-auto px-8 md:px-10 py-4 md:py-4.5 rounded-xl md:rounded-[20px] text-[10px] md:text-sm font-black bg-neutral-900 text-white hover:bg-neutral-800 transition-all disabled:opacity-40 flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 uppercase tracking-widest order-1 md:order-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 md:w-[18px] md:h-[18px]" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                      Salvar e Finalizar
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 md:bottom-10 md:right-10 md:left-auto z-[60] bg-neutral-900 text-white px-6 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[24px] text-xs md:text-sm font-bold shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 md:gap-4 animate-[slideUp_0.4s_ease-out] border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="text-green-400 w-4.5 h-4.5 md:w-5 md:h-5" />
          </div>
          <span className="flex-1">{toast}</span>
        </div>
      )}
    </>
  )
}
