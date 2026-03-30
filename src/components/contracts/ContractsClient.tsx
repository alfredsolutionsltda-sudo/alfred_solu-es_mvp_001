'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { ContractWithClient, ContractMetrics as ContractMetricsType } from '@/types/contracts'
import ContractMetricsComponent from '@/components/contracts/ContractMetrics'
import ContractTable from '@/components/contracts/ContractTable'
import { Plus, AlertTriangle, Bell, Info, ArrowRight, Loader2 } from 'lucide-react'
import { getContractAlertsAction } from '@/app/actions/contractActions'
import Link from 'next/link'

const ContractDrawer = dynamic(() => import('@/components/contracts/ContractDrawer'), {
  loading: () => <div className="fixed inset-y-0 right-0 w-full md:w-[640px] bg-white animate-pulse" />
})

const NewContractModal = dynamic(() => import('@/components/contracts/NewContractModal'), {
  loading: () => <div className="fixed inset-0 bg-black/50 animate-pulse" />
})

interface Client {
  id: string
  name: string
  email: string | null
  cpf_cnpj: string | null
}

interface ContractsClientProps {
  contracts: any[]
  metrics: ContractMetricsType
  userId: string
  clients: Client[]
  mode?: 'contracts' | 'proposals'
}

export default function ContractsClient({
  contracts,
  metrics,
  userId,
  clients,
  mode = 'contracts',
}: ContractsClientProps) {
  const [selectedContract, setSelectedContract] = useState<ContractWithClient | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await getContractAlertsAction()
      if (res.success) {
        setAlerts(res.data || [])
      }
      setLoadingAlerts(false)
    }
    fetchAlerts()
  }, [])

  const isProposals = mode === 'proposals'

  const handleSelectContract = (contract: ContractWithClient) => {
    setSelectedContract(contract)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedContract(null), 300)
  }

  const handleContractCreated = (contract: { id: string; slug: string }) => {
    // Encontra o contrato criado na lista (após refresh)
    const found = contracts.find((c) => c.id === contract.id)
    if (found) {
      setSelectedContract(found)
      setDrawerOpen(true)
    }
  }

  return (
    <main className="min-h-screen bg-surface pt-6 md:pt-12 pb-24 md:pb-20 px-6 md:px-10 max-w-[1600px] mx-auto space-y-8 md:space-y-12">
      {/* Header Standardized */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-3xl md:text-6xl font-headline font-black text-neutral-900 tracking-tighter">
            {isProposals ? 'Propostas' : 'Contratos'}
          </h1>
          <p className="text-neutral-500 font-bold text-base md:text-lg tracking-tight">
            {isProposals ? 'Crie e acompanhe suas propostas comerciais.' : 'Gestão inteligente e assinatura digital simplificada.'}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2.5 px-6 md:px-8 py-3.5 md:py-4.5 rounded-xl md:rounded-[20px] bg-[#1455CE] text-white text-xs md:text-sm font-black hover:bg-[#114ab3] transition-all shadow-xl shadow-[#1455CE]/20 hover:-translate-y-1 active:scale-95 uppercase tracking-widest w-full md:w-auto"
        >
          <Plus size={18} className="md:size-5 stroke-[3px]" />
          {isProposals ? 'Nova Proposta' : 'Novo Contrato'}
        </button>
      </header>

      {/* Métricas */}
      <ContractMetricsComponent metrics={metrics} mode={mode} />

      {/* Alerta Antecipado (Destaque) */}
      {!loadingAlerts && alerts.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="bg-gradient-to-br from-[#1455CE] to-[#0A2E7A] rounded-[32px] p-6 md:p-8 text-white shadow-2xl shadow-[#1455CE]/20 relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-[20px] bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg border border-white/20 animate-bounce-slow">
                    <Bell size={28} className="text-white fill-white/20" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-headline font-black tracking-tight mb-2 flex items-center gap-2">
                       Alerta Antecipado
                       <span className="px-2 py-0.5 bg-red-500 rounded-full text-[10px] uppercase tracking-widest animate-pulse">Crítico</span>
                    </h2>
                    <p className="text-blue-100 font-bold text-sm md:text-base leading-relaxed max-w-xl">
                      Alfred identificou que você tem <span className="text-white underline decoration-white/30 underline-offset-4">{alerts.length} itens</span> que precisam de atenção imediata para evitar perdas ou atrasos.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="hidden lg:flex flex-col items-end mr-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">Status Geral</p>
                     <p className="text-sm font-black text-white">Ação Recomendada</p>
                  </div>
                  <button 
                    onClick={() => {
                        // Rola para a tabela com o filtro de alertas
                        const tableElement = document.getElementById('contract-table-section')
                        tableElement?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-white text-[#1455CE] text-xs font-black uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-xl active:scale-95"
                  >
                    Resolver Agora
                    <ArrowRight size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
              
              {/* Little detail cards for quick context */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.slice(0, 3).map((alert, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      const found = contracts.find(c => c.id === alert.contractId)
                      if (found) handleSelectContract(found)
                    }}
                    className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl flex items-start gap-3 hover:bg-white/20 transition-all cursor-pointer group/card"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                       <AlertTriangle size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 truncate">{alert.title}</p>
                      <p className="text-xs font-bold text-white truncate">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>
      )}

      {/* Tabela */}
      <div className="pt-4" id="contract-table-section">
        <ContractTable
          contracts={contracts}
          onSelectContract={handleSelectContract}
          selectedContractId={selectedContract?.id}
          mode={mode}
        />
      </div>

      {/* Drawer */}
      <ContractDrawer
        contract={selectedContract}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
      />

      {/* Modal Novo Contrato */}
      <NewContractModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
        clients={clients}
        onContractCreated={handleContractCreated}
      />
    </main>
  )
}

