import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getContracts, getContractMetrics, getUserClients } from '@/lib/data/contracts'
import ContractsClient from '@/components/contracts/ContractsClient'

export const metadata = {
  title: 'Propostas — Alfred',
  description: 'Gerencie suas propostas comerciais com IA.',
}

export default async function PropostasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca dados em paralelo (usa a mesma fonte de contratos)
  const [contracts, metrics, clients] = await Promise.all([
    getContracts(user.id),
    getContractMetrics(user.id),
    getUserClients(user.id),
  ])

  return (
    <ContractsClient
        contracts={contracts}
        metrics={metrics}
        userId={user.id}
        clients={clients}
        mode="proposals"
    />
  )
}
