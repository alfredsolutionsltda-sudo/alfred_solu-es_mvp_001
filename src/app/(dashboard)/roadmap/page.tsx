import { getRoadmapIssuesAction } from '@/app/actions/linearActions'
import { 
  Sparkles, 
  Bug, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  Map,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const StatusIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'started': return <TrendingUp className="text-blue-500" size={16} />
    case 'unstarted': return <Circle className="text-neutral-300" size={16} />
    case 'completed': return <CheckCircle2 className="text-green-500" size={16} />
    default: return <Clock className="text-amber-500" size={16} />
  }
}

export default async function RoadmapPage() {
  const result = await getRoadmapIssuesAction()

  if (!result.success) {
    return (
      <div className="p-8 md:p-12 lg:p-16 text-center">
        <h1 className="text-2xl font-black text-neutral-900">Ops! Erro no Roadmap</h1>
        <p className="text-neutral-500 mt-2">{result.error}</p>
      </div>
    )
  }

  const issues = result.data || []
  
  // Categorizar issues
  const inProgress = issues.filter(i => i.statusType === 'started')
  const planned = issues.filter(i => i.statusType === 'unstarted')
  const completed = issues.filter(i => i.statusType === 'completed')

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="mb-12 relative overflow-hidden rounded-[40px] bg-[#1455CE] p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <Map size={14} />
            Roadmap do Alfred
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight mb-4">
            Construindo o futuro do <span className="text-blue-200">Chief of Staff AI.</span>
          </h1>
          <p className="text-lg text-blue-100 font-bold opacity-90 leading-relaxed">
            Aqui você acompanha em tempo real o que nosso time está desenvolvendo para tornar o Alfred a plataforma mais poderosa do Brasil.
          </p>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[10%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Em Progresso */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-3 text-sm font-black text-neutral-900 uppercase tracking-widest">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <TrendingUp size={16} strokeWidth={2.5} />
              </div>
              Em Progresso
              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">{inProgress.length}</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {inProgress.length === 0 ? (
              <EmptyState message="Nada em progresso no momento." />
            ) : (
              inProgress.map((issue) => (
                <RoadmapItem key={issue.id} issue={issue} />
              ))
            )}
          </div>
        </div>

        {/* Planejado */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-3 text-sm font-black text-neutral-900 uppercase tracking-widest">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Circle size={16} strokeWidth={2.5} />
              </div>
              Planejado
              <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded-full">{planned.length}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {planned.length === 0 ? (
              <EmptyState message="Nenhuma tarefa planejada." />
            ) : (
              planned.map((issue) => (
                <RoadmapItem key={issue.id} issue={issue} />
              ))
            )}
          </div>
        </div>

        {/* Recentemente Entregue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-3 text-sm font-black text-neutral-900 uppercase tracking-widest">
              <div className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <CheckCircle2 size={16} strokeWidth={2.5} />
              </div>
              Entregue
              <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] rounded-full">{completed.length}</span>
            </h2>
          </div>

          <div className="space-y-4 opacity-80">
            {completed.length === 0 ? (
              <EmptyState message="Ninguém entregou nada ainda." />
            ) : (
              completed.map((issue) => (
                <RoadmapItem key={issue.id} issue={issue} />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-16 p-8 bg-neutral-50 rounded-[32px] border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <ShieldCheck className="text-[#1455CE]" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900">Segurança & Transparência</h3>
              <p className="text-sm font-bold text-neutral-400">Este roadmap é espelhado diretamente do nosso Linear interno.</p>
            </div>
         </div>
         <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-black text-neutral-900 hover:bg-neutral-50 transition-all"
         >
           Voltar para o Início
           <ArrowRight size={16} />
         </Link>
      </div>
    </div>
  )
}

function RoadmapItem({ issue }: { issue: any }) {
  return (
    <div className="group bg-white p-5 rounded-[24px] border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-[#1455CE]/5 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.map((label: string) => (
            <span key={label} className="px-2 py-0.5 bg-neutral-50 text-neutral-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-neutral-100">
              {label}
            </span>
          ))}
          {issue.labels.length === 0 && (
             <span className="px-2 py-0.5 bg-neutral-50 text-neutral-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-neutral-100">
              Atualização
           </span>
          )}
        </div>
        <StatusIcon type={issue.statusType} />
      </div>
      
      <h3 className="text-sm font-black text-neutral-900 leading-snug group-hover:text-[#1455CE] transition-colors line-clamp-2">
        {issue.title}
      </h3>
      
      <div className="mt-4 pt-4 border-t border-dotted border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${issue.priority === 1 ? 'bg-red-500' : issue.priority === 2 ? 'bg-amber-500' : 'bg-blue-500'}`} />
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{issue.priorityLabel}</span>
        </div>
        <span className="text-[10px] font-bold text-neutral-300 uppercase">#{issue.id.split('-')[0]}</span>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 text-center bg-neutral-50/50 rounded-[24px] border border-dashed border-neutral-100">
      <p className="text-xs font-bold text-neutral-400">{message}</p>
    </div>
  )
}
