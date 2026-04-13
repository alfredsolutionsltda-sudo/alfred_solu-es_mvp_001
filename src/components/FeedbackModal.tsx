'use client'

import { useState } from 'react'
import { X, Send, AlertCircle, Sparkles, Bug, MessageSquare, CheckCircle2 } from 'lucide-react'
import AlfredButton from './AlfredButton'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other'

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeedbackType>('improvement')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar feedback')
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
        setTitle('')
        setDescription('')
        setType('improvement')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-neutral-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-headline font-black text-neutral-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1455CE]/5 flex items-center justify-center text-[#1455CE]">
                <MessageSquare size={20} strokeWidth={2.5} />
              </div>
              Enviar Feedback
            </h2>
            <p className="text-sm font-bold text-neutral-400 mt-1">
              Sua opinião ajuda o Alfred a ser cada vez melhor.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-headline font-black text-neutral-900 mb-2">Feedback Enviado!</h3>
            <p className="text-neutral-500 font-bold max-w-xs mx-auto">
              Recebemos sua mensagem e já criamos um ticket no nosso sistema. Obrigado!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 text-sm font-bold">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Type Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">
                Sobre o que você quer falar?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'improvement', label: 'Melhoria', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { id: 'bug', label: 'Bug / Erro', icon: Bug, color: 'text-red-500', bg: 'bg-red-50' },
                  { id: 'feature', label: 'Sugestão', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { id: 'other', label: 'Outro', icon: AlertCircle, color: 'text-neutral-500', bg: 'bg-neutral-50' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as FeedbackType)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      type === item.id 
                        ? 'border-[#1455CE] bg-[#1455CE]/5 shadow-sm' 
                        : 'border-neutral-50 bg-neutral-50/30 hover:border-neutral-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === item.id ? 'bg-[#1455CE] text-white' : `${item.bg} ${item.color}`}`}>
                      <item.icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className={`text-sm font-black ${type === item.id ? 'text-[#1455CE]' : 'text-neutral-600'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="feedback-title" className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">
                Assunto
              </label>
              <input
                id="feedback-title"
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Erro ao baixar nota fiscal"
                className="w-full px-5 py-4 bg-neutral-50/50 border-2 border-neutral-100 rounded-2xl focus:outline-none focus:border-[#1455CE] focus:bg-white transition-all text-sm font-bold text-neutral-900 placeholder:text-neutral-300"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="feedback-desc" className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">
                Detalhes
              </label>
              <textarea
                id="feedback-desc"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte para nós com mais detalhes o que aconteceu ou sua sugestão..."
                className="w-full px-5 py-4 bg-neutral-50/50 border-2 border-neutral-100 rounded-2xl focus:outline-none focus:border-[#1455CE] focus:bg-white transition-all text-sm font-bold text-neutral-900 placeholder:text-neutral-300 resize-none"
              />
            </div>

            <div className="pt-2">
              <AlfredButton
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send size={18} strokeWidth={2.5} />
                    Enviar Feedback para o Time
                  </div>
                )}
              </AlfredButton>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
