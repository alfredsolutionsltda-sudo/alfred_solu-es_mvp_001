'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ContractWithClient, ContractMetrics as ContractMetricsType } from '@/types/contracts'
import ContractMetricsComponent from '@/components/contracts/ContractMetrics'
import ContractTable from '@/components/contracts/ContractTable'
import { Plus } from 'lucide-react'

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

      {/* Tabela */}
      <div className="pt-4">
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

