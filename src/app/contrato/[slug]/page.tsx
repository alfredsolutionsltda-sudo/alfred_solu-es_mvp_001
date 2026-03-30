import { getContractBySlug } from '@/lib/data/contracts'
import SignatureForm from './SignatureForm'
import DownloadButton from './DownloadButton'
import ReadingTrack from '@/components/contracts/ReadingTrack'
import Image from 'next/image'
import { FileText, Bot, CheckCircle } from 'lucide-react'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const contract = await getContractBySlug(slug)

  return {
    title: contract
      ? `${contract.title} — Assinatura`
      : 'Contrato não encontrado',
    description: contract
      ? `Assine o contrato de ${contract.service_type || 'prestação de serviços'}`
      : undefined,
  }
}

export default async function ContratoPublicPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const contract = await getContractBySlug(slug)

  if (!contract) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 bg-[#EFEFED] min-h-screen">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
            <FileText className="text-neutral-300" size={40} />
          </div>
          <h1 className="text-2xl font-headline font-black text-neutral-900 mb-2">
            Contrato não encontrado
          </h1>
          <p className="text-neutral-500 font-medium">
            O link pode estar expirado ou incorreto.
          </p>
        </div>
      </div>
    )
  }

  // Se já assinado
  if (contract.signed_at) {
    const signedDate = new Date(contract.signed_at).toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    return (
      <div className="flex-1 flex flex-col bg-[#EFEFED] min-h-screen">
        {/* Header */}
        <header className="py-6 px-8 border-b border-neutral-200/40 bg-white/60 backdrop-blur-xl no-print">
          <div className="max-w-[720px] mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border border-neutral-100 overflow-hidden">
              <Image
                src="/images/alfred-head.png"
                alt="Alfred"
                width={36}
                height={36}
                className="object-contain p-1"
              />
            </div>
            <div>
              <span className="text-lg font-headline font-black text-neutral-900 tracking-tight">
                Alfred
              </span>
              {contract.professional?.full_name && (
                <span className="text-sm font-bold text-neutral-400 ml-2">
                  · {contract.professional.full_name}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12 no-print">
          <div className="bg-white rounded-[32px] border border-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-[720px] w-full p-12 text-center no-print">
            <div className="w-20 h-20 bg-green-50 rounded-[24px] flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="text-3xl font-headline font-black text-neutral-900 mb-3 tracking-tight">
              Contrato assinado
            </h1>
            <p className="text-neutral-500 font-medium mb-10 max-w-[320px] mx-auto">
              Este documento foi assinado digitalmente e está legalmente validado.
            </p>

            <div className="bg-neutral-50 rounded-[24px] p-8 space-y-4 text-left border border-neutral-100/50 mb-10">
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Assinado por
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {contract.signed_by_name}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Documento
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {contract.signed_by_document}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Data/Hora
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {signedDate}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  IP Registrado
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {contract.signed_by_ip || 'N/A'}
                </span>
              </div>
            </div>

            <DownloadButton />
          </div>
        </div>

        {/* Versão para impressão (visível apenas ao imprimir) */}
        <div className="hidden print-only p-12 bg-white text-neutral-900">
          <div className="mb-10 text-center border-b pb-8">
            <h1 className="text-3xl font-bold mb-2">{contract.title}</h1>
            <p className="text-sm text-neutral-500">Documento assinado digitalmente via Alfred</p>
          </div>
          
          <div className="mb-10 whitespace-pre-wrap leading-relaxed text-sm">
            {contract.contract_body}
          </div>

          <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-neutral-400">Assinatura Digital</h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="font-bold">Assinado por:</span> <span>{contract.signed_by_name}</span>
              <span className="font-bold">Documento:</span> <span>{contract.signed_by_document}</span>
              <span className="font-bold">Data/Hora:</span> <span>{signedDate}</span>
              <span className="font-bold">IP:</span> <span>{contract.signed_by_ip || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formatação
  const formatCurrency = (value: number | null) =>
    value
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ 0'

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="flex-1 flex flex-col bg-[#EFEFED] min-h-screen">
      {/* Header */}
      <header className="py-6 px-8 border-b border-neutral-200/40 bg-white/60 backdrop-blur-xl no-print">
        <div className="max-w-[720px] mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border border-neutral-100 overflow-hidden">
            <Image
              src="/images/alfred-head.png"
              alt="Alfred"
              width={36}
              height={36}
              className="object-contain p-1"
            />
          </div>
          <div>
            <span className="text-lg font-headline font-black text-neutral-900 tracking-tight">
              Alfred
            </span>
            {contract.professional?.full_name && (
              <span className="text-sm font-bold text-neutral-400 ml-2">
                · {contract.professional.full_name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 no-print">
        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-[720px] w-full overflow-hidden">
          {/* Topo do card */}
          <div className="bg-[#1455CE]/5 p-8 border-b border-neutral-100">
            <h1 className="text-2xl font-headline font-black text-neutral-900 mb-2 tracking-tight">
              {contract.service_type || contract.title}
            </h1>
            <div className="flex items-center gap-4 text-sm font-bold text-neutral-400">
              <span className="text-[#1455CE] text-xl font-black">
                {formatCurrency(contract.value)}
              </span>
              <span className="opacity-30">·</span>
              <span className="tracking-tight">
                {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
              </span>
            </div>
          </div>

          {/* Texto do contrato */}
          <div className="p-8">
            <div className="bg-neutral-50 rounded-[24px] p-8 max-h-[50vh] overflow-y-auto border border-neutral-100/50">
              <pre className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap font-sans font-medium">
                {contract.contract_body || 'Texto do contrato não disponível.'}
              </pre>
            </div>
          </div>

          {/* Formulário de assinatura */}
          <SignatureForm slug={slug} />
        </div>
      </div>
      <ReadingTrack slug={slug} />
    </div>
  )
}
