import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'
import type {
  ContractWithClient,
  ContractFullPublic,
  ContractMetrics,
  ContractFormData,
  ContractFilters,
  SignatureData,
} from '@/types/contracts'

// Cliente com service role para operações SECURITY DEFINER
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─────────────────────────────────────────
// getContracts — lista contratos do usuário
// ─────────────────────────────────────────
export async function getContracts(
  userId: string,
  filters?: ContractFilters
): Promise<ContractWithClient[]> {
  const supabase = await createClient()

  let query = supabase
    .from('contracts')
    .select(`
      id, user_id, client_id, title, description, value, status, start_date, end_date, signed_at, public_token, created_at, updated_at, slug, version, payment_terms, service_type, contract_body,
      read_at, total_reading_time, rejection_reason, rejected_at, last_follow_up_at, follow_up_count,
      client:clients (
        id, user_id, name, type, cpf_cnpj, status, status_manual, email, phone, company_name, cnpj, industry, notes, website, created_at, updated_at, inadimplency_score, alfred_context
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,service_type.ilike.%${filters.search}%`
    )
  }

  if (filters?.dateRange?.start) {
    query = query.gte('created_at', filters.dateRange.start)
  }

  if (filters?.dateRange?.end) {
    query = query.lte('created_at', filters.dateRange.end)
  }

  if (filters?.limit) {
    const limit = filters.limit
    const offset = filters.offset || 0
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar contratos:', error)
    return []
  }

  return (data || []) as unknown as ContractWithClient[]
}

// ─────────────────────────────────────────
// getContractBySlug — público, sem auth
// ─────────────────────────────────────────
export async function getContractBySlug(
  slug: string
): Promise<ContractFullPublic | null> {
  const serviceClient = getServiceClient()

  const { data, error } = await serviceClient.rpc('get_contract_by_slug', {
    p_slug: slug,
  })

  if (error) {
    console.error('Erro ao buscar contrato por slug:', error)
    return null
  }

  return data as unknown as ContractFullPublic | null
}

// ─────────────────────────────────────────
// getContractMetrics
// ─────────────────────────────────────────
export async function getContractMetrics(
  userId: string
): Promise<ContractMetrics> {
  const supabase = await createClient()

  const [
    { count: totalAtivos },
    { count: pendentesAssinatura },
    { data: valorAtivoData },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'ativo'),

    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pendente_assinatura'),

    supabase
      .from('contracts')
      .select('value')
      .eq('user_id', userId)
      .eq('status', 'ativo'),
  ])

  // Contratos vencendo em 30 dias
  const hoje = new Date()
  const em30Dias = new Date()
  em30Dias.setDate(em30Dias.getDate() + 30)

  const { count: vencendoEm30Dias } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['ativo', 'vencendo'])
    .gte('end_date', hoje.toISOString().split('T')[0])
    .lte('end_date', em30Dias.toISOString().split('T')[0])

  const valorTotalAtivo =
    valorAtivoData?.reduce((sum, c) => sum + Number(c.value || 0), 0) || 0

  // Cálculo de conversão para propostas
  const { count: totalPropostas } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const taxaConversao = totalPropostas ? Math.round(((totalAtivos || 0) / totalPropostas) * 100) : 0

  return {
    totalAtivos: totalAtivos || 0,
    pendentesAssinatura: pendentesAssinatura || 0,
    vencendoEm30Dias: vencendoEm30Dias || 0,
    valorTotalAtivo,
    taxaConversao,
    totalPropostas: totalPropostas || 0
  }
}

// ─────────────────────────────────────────
// createContract
// ─────────────────────────────────────────
export async function createContract(
  userId: string,
  data: ContractFormData
): Promise<ContractWithClient | null> {
  const supabase = await createClient()
  const slug = nanoid(10)

  let clientId = data.clientId || null

  // Se não tem client_id, cria o cliente automaticamente
  if (!clientId && data.clientName) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', data.clientName)
      .limit(1)
      .single()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: data.clientName,
          email: data.clientEmail || null,
          status: 'ativo',
        })
        .select('id')
        .single()

      if (clientError) {
        console.error('Erro ao criar cliente:', clientError)
      } else {
        clientId = newClient.id
      }
    }
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      user_id: userId,
      client_id: clientId,
      title: data.title || `Contrato - ${data.serviceType}`,
      description: data.description || `Prestação de serviços: ${data.serviceType}`,
      contract_body: data.contractBody,
      value: data.value,
      status: 'pendente_assinatura',
      start_date: data.startDate,
      end_date: data.endDate,
      slug,
      version: 1,
      payment_terms: data.paymentTerms,
      service_type: data.serviceType,
    })
    .select(`
      *,
      client:clients (
        id, user_id, name, type, cpf_cnpj, status, status_manual, email, phone, company_name, cnpj, industry, notes, website, created_at, updated_at, inadimplency_score, alfred_context
      )
    `)
    .single()

  if (error) {
    console.error('Erro ao criar contrato:', error)
    return null
  }

  return contract as unknown as ContractWithClient
}

// ─────────────────────────────────────────
// updateContractStatus
// ─────────────────────────────────────────
export async function updateContractStatus(
  contractId: string,
  userId: string,
  status: string
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', contractId)
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao atualizar status:', error)
    return false
  }

  return true
}

// ─────────────────────────────────────────
// signContract — público, sem auth
// ─────────────────────────────────────────
export async function signContract(
  slug: string,
  signatureData: SignatureData
) {
  const serviceClient = getServiceClient()

  const { data, error } = await serviceClient.rpc('sign_contract_by_slug', {
    p_slug: slug,
    p_signed_by_name: signatureData.name,
    p_signed_by_document: signatureData.document,
    p_signed_by_ip: signatureData.ip,
    p_signed_at: signatureData.signed_at,
  })

  if (error) {
    console.error('Erro ao assinar contrato:', error)
    return null
  }

  // Após assinar, move o contrato para o status 'ativo' para que seja 
  // contabilizado nas métricas e apareça no dashboard.
  await serviceClient
    .from('contracts')
    .update({ status: 'ativo' })
    .eq('slug', slug)

  return data
}

// ─────────────────────────────────────────
// getUserClients — para autocomplete
// ─────────────────────────────────────────
export async function getUserClients(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, cpf_cnpj')
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .order('name')

  if (error) {
    console.error('Erro ao buscar clientes:', error)
    return []
  }

  return data || []
}

// ─────────────────────────────────────────
// renewContract — cria novo contrato com version + 1
// ─────────────────────────────────────────
export async function renewContract(
  userId: string,
  originalContractId: string,
  newEndDate: string,
  newValue: number
): Promise<ContractWithClient | null> {
  const supabase = await createClient()

  // Busca contrato original
  const { data: original, error: fetchError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', originalContractId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !original) {
    console.error('Erro ao buscar contrato original:', fetchError)
    return null
  }

  const slug = nanoid(10)

  const { data: renewed, error } = await supabase
    .from('contracts')
    .insert({
      user_id: userId,
      client_id: original.client_id,
      title: original.title,
      description: original.description,
      contract_body: original.contract_body,
      value: newValue,
      status: 'pendente_assinatura',
      start_date: original.end_date, // começa onde o anterior terminou
      end_date: newEndDate,
      slug,
      version: (original.version || 1) + 1,
      payment_terms: original.payment_terms,
      service_type: original.service_type,
    })
    .select(`
      *,
      client:clients (
        id,
        name,
        email,
        phone,
        cpf_cnpj
      )
    `)
    .single()

  if (error) {
    console.error('Erro ao renovar contrato:', error)
    return null
  }

  // Marca o antigo como encerrado
  await supabase
    .from('contracts')
    .update({ status: 'encerrado' })
    .eq('id', originalContractId)
    .eq('user_id', userId)

  return renewed as unknown as ContractWithClient
}

// ─────────────────────────────────────────
// getContractAlerts
// ─────────────────────────────────────────
export async function getContractAlerts(userId: string) {
  const supabase = await createClient()

  // 1. Contratos que vencem nos próximos 15 dias
  const hoje = new Date()
  const em15Dias = new Date()
  em15Dias.setDate(em15Dias.getDate() + 15)

  const { data: expiringContracts } = await supabase
    .from('contracts')
    .select('id, title, end_date, client:clients(name)')
    .eq('user_id', userId)
    .in('status', ['ativo', 'vencendo'])
    .gte('end_date', hoje.toISOString().split('T')[0])
    .lte('end_date', em15Dias.toISOString().split('T')[0])

  // 2. Propostas "esquecidas" (> 3 dias sem leitura)
  const tresDiasAtras = new Date()
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)

  const { data: staleProposals } = await supabase
    .from('contracts')
    .select('id, title, created_at, client:clients(name)')
    .eq('user_id', userId)
    .in('status', ['enviado', 'pendente_assinatura'])
    .is('read_at', null)
    .lt('created_at', tresDiasAtras.toISOString())

  const alerts: any[] = []

  expiringContracts?.forEach((c: any) => {
    alerts.push({
      id: `exp-${c.id}`,
      contractId: c.id,
      title: 'Contrato Vencendo',
      message: `O contrato de "${c.client?.name || 'Cliente'}" vence em breve (${new Date(c.end_date).toLocaleDateString('pt-BR')}).`,
      type: 'warning',
      date: c.end_date
    })
  })

  staleProposals?.forEach((c: any) => {
    alerts.push({
      id: `stale-${c.id}`,
      contractId: c.id,
      title: 'Proposta Parada',
      message: `A proposta para "${c.client?.name || 'Cliente'}" ainda não foi visualizada.`,
      type: 'info',
      date: c.created_at
    })
  })

  return alerts
}
