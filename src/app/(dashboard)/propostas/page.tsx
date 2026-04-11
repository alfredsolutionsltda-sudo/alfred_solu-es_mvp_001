import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getContracts, getContractMetrics, getUserClients } from '@/lib/data/contracts'
import ContractsClient from '@/components/contracts/ContractsClient'

export const metadata = {
  title: 'Propostas — Alfred',
  description: 'Gerencie suas propostas comerciais com IA.',
}

export default async function PropostasPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca dados em paralelo (usa a mesma fonte de contratos)
  const [contractsResult, metrics, clients] = await Promise.all([
    getContracts(user.id, { limit: pageSize, offset }),
    getContractMetrics(user.id),
    getUserClients(user.id),
  ])

  return (
    <ContractsClient
        contracts={contractsResult.data}
        metrics={metrics}
        userId={user.id}
        clients={clients}
        mode="proposals"
        totalCount={contractsResult.count}
        currentPage={page}
        pageSize={pageSize}
    />
  )
}
