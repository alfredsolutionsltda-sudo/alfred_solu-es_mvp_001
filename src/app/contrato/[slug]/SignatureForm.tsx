'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, PenTool, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { rejectProposalAction } from '@/app/actions/contractActions'

interface SignatureFormProps {
  slug: string
}

export default function SignatureForm({ slug }: SignatureFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [signedData, setSignedData] = useState<{
    name: string
    date: string
    ip: string
  } | null>(null)
  const [error, setError] = useState('')
  const [showRejectionInput, setShowRejectionInput] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejected, setRejected] = useState(false)

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const isValid = name.trim().length >= 3 && cpf.replace(/\D/g, '').length === 11 && accepted

  const handleSign = async () => {
    if (!isValid) return
    setSigning(true)
    setError('')

    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          document: cpf,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao assinar contrato')
        return
      }

      setSigned(true)
      setSignedData({
        name: name.trim(),
        date: new Date().toLocaleString('pt-BR', {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
        ip: data.ip || 'Registrado',
      })

      // Revalida a página
      setTimeout(() => router.refresh(), 1500)
    } catch {
      setError('Erro de conexão ao assinar contrato')
    } finally {
      setSigning(false)
    }
  }
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    setIsRejecting(true)
    setError('')
    
    try {
      const res = await rejectProposalAction(slug, rejectionReason.trim())
      if (res.success) {
        setRejected(true)
        setTimeout(() => router.refresh(), 1500)
      } else {
        setError(res.error || 'Erro ao recusar proposta')
      }
    } catch {
      setError('Erro de conexão ao recusar proposta')
    } finally {
      setIsRejecting(false)
    }
  }

  if (rejected) {
    return (
      <div className="p-12 border-t border-neutral-100 bg-red-50/20 no-print text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-100 rounded-[24px] flex items-center justify-center mb-6">
          <XCircle className="text-red-500" size={32} />
        </div>
        <h3 className="text-xl font-headline font-black text-red-900 mb-2">Proposta Recusada</h3>
        <p className="text-sm font-medium text-red-700/70 max-w-[300px]">
          Sua recusa foi registrada com sucesso. O profissional será notificado.
        </p>
      </div>
    )
  }

  if (signed && signedData) {
    return (
      <div className="p-8 border-t border-neutral-100 bg-green-50/30 no-print">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-headline font-black text-green-900 mb-2">
            Contrato assinado!
          </h3>
          <p className="text-sm font-medium text-green-700/80 mb-8">
            Uma confirmação foi enviada para o profissional.
          </p>
          <div className="bg-white rounded-[24px] p-6 space-y-4 text-sm text-left border border-green-100 shadow-sm">
            <div className="flex justify-between items-center py-2 border-b border-neutral-50">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Assinado por</span>
              <span className="font-bold text-neutral-900">
                {signedData.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-50">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Data/Hora</span>
              <span className="font-bold text-neutral-900">
                {signedData.date}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">IP registrado</span>
              <span className="font-bold text-neutral-900">
                {signedData.ip}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 border-t border-neutral-100 bg-[#FAFAFA] no-print">
      <h3 className="text-sm font-black text-neutral-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
        <PenTool className="text-[#1455CE]" size={16} />
        Assinar contrato
      </h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div>
            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-white placeholder:text-neutral-300"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-white placeholder:text-neutral-300"
            />
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl border border-neutral-100 transition-colors hover:bg-white select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5 rounded-lg border-neutral-300 text-[#1455CE] focus:ring-[#1455CE]/20 cursor-pointer transition-all"
          />
          <span className="text-sm font-semibold text-neutral-500 group-hover:text-black transition-colors">
            Li e aceito os termos deste contrato
          </span>
        </label>

        {error && (
          <div className="bg-red-50 text-red-700 px-5 py-4 rounded-2xl text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Botão */}
        <button
          onClick={handleSign}
          disabled={!isValid || signing}
          className="w-full py-4 rounded-2xl text-sm font-black bg-[#1455CE] text-white hover:bg-[#114ab3] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-[#1455CE]/20 uppercase tracking-widest active:scale-[0.98]"
        >
          {signing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Assinando...
            </>
          ) : (
            <>
              <PenTool size={18} />
              Assinar contrato
            </>
          )}
        </button>

        {/* Opção de recusa */}
        <div className="pt-2 text-center">
          {!showRejectionInput ? (
            <button
              onClick={() => setShowRejectionInput(true)}
              className="text-[10px] font-black text-neutral-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
            >
              Não aceito e gostaria de recusar
            </button>
          ) : (
            <div className="bg-white p-6 rounded-[24px] border border-red-100 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle size={14} className="stroke-[3px]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Diga ao Alfred o motivo da recusa</span>
              </div>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: O valor está acima do mercado / O prazo não me atende..."
                className="w-full px-5 py-4 rounded-2xl border border-neutral-100 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all bg-neutral-50/50 min-h-[100px] resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectionInput(false)}
                  className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isRejecting}
                  className="flex-[2] py-3.5 rounded-xl text-[10px] bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-30 shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
                >
                  {isRejecting ? <Loader2 className="animate-spin" size={14} /> : 'Confirmar Recusa'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
