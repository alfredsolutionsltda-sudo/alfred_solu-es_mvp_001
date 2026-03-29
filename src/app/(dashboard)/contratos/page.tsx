import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getContracts, getContractMetrics, getUserClients } from '@/lib/data/contracts'
import { updateContractStatuses } from '@/lib/cron/updateContractStatus'
import ContractsClient from '@/components/contracts/ContractsClient'

export const metadata = {
  title: 'Contratos — Alfred',
  description: 'Gerencie seus contratos de prestação de serviços com IA.',
}

export default async function ContratosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Atualiza status dos contratos automaticamente
  try {
    await updateContractStatuses()
  } catch (err) {
    console.error('Erro ao atualizar status dos contratos:', err)
  }

  // Busca dados em paralelo
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
      mode="contracts"
    />
  )
}
