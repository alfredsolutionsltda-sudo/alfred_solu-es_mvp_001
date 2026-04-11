import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getContracts, getContractMetrics, getUserClients } from '@/lib/data/contracts'
import { updateContractStatuses } from '@/lib/cron/updateContractStatus'
import ContractsClient from '@/components/contracts/ContractsClient'

export const metadata = {
  title: 'Contratos — Alfred',
  description: 'Gerencie seus contratos de prestação de serviços com IA.',
}

export default async function ContratosPage(props: {
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

  // Atualiza status dos contratos automaticamente
  try {
    await updateContractStatuses()
  } catch (err) {
    console.error('Erro ao atualizar status dos contratos:', err)
  }

  // Busca dados em paralelo
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
      mode="contracts"
      totalCount={contractsResult.count}
      currentPage={page}
      pageSize={pageSize}
    />
  )
}
