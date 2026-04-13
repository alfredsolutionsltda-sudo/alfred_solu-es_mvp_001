import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { ClientFormData, ClientWithMetrics } from '@/types/clients';
import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache/redis';

export async function getClients(userId: string, filters?: { status?: string, search?: string, limit?: number, offset?: number }): Promise<{ data: ClientWithMetrics[], count: number }> {
  const supabase = await createSupabaseServerClient();
  
  const limit = filters?.limit || 10;
  const offset = filters?.offset || 0;

  let query = supabase.from('clients').select(`
    id, user_id, name, type, cpf_cnpj, status, status_manual, email, phone, company_name, cnpj, industry, notes, website, created_at, updated_at, inadimplency_score, alfred_context,
    faturamento ( amount, status ),
    contracts ( id, status, end_date, slug )
  `, { count: 'exact' }).eq('user_id', userId);

  if (filters?.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  query = query
    .range(offset, offset + limit - 1)
    .order('name', { ascending: true });

  const { data: clientsData, error, count } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(`Erro ao buscar clientes: ${error.message} (Código: ${error.code})`);
  }

  const enrichedClients: ClientWithMetrics[] = clientsData.map((client: any) => {
    let billed = 0;
    let pending = 0;
    let activeContractsCount = 0;
    let nextDate: string | null = null;
    
    if (client.faturamento) {
      client.faturamento.forEach((f: any) => {
        const val = Number(f.amount) || 0;
        if (f.status === 'pago') billed += val;
        if (f.status === 'pendente' || f.status === 'atrasado') pending += val;
      });
    }

    if (client.contracts) {
      const activeContracts = client.contracts.filter((c: any) => c.status === 'ativo');
      activeContractsCount = activeContracts.length;
      
      const dates = activeContracts
        .map((c: any) => c.end_date)
        .filter(Boolean)
        .sort();
      if (dates.length > 0) nextDate = dates[0];
    }

    return {
      ...client,
      user_id: client.user_id,
      status_manual: client.status_manual,
      updated_at: client.updated_at,
      total_billed: billed,
      total_pending: pending,
      active_contracts: activeContractsCount,
      next_due_date: nextDate,
    };
  });

  return {
    data: enrichedClients,
    count: count || 0
  };
}

export async function getClientById(userId: string, clientId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data: client, error } = await supabase.from('clients')
    .select(`
      id, user_id, name, type, cpf_cnpj, status, status_manual, email, phone, company_name, cnpj, industry, notes, website, created_at, updated_at, inadimplency_score, alfred_context,
      faturamento ( id, amount, status, due_date, description, paid_at ),
      contracts ( id, title, status, value, end_date, slug )
    `)
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`Error fetching client ${clientId}:`, error);
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Erro ao buscar detalhes do cliente: ${error.message}`);
  }
  if (!client) return null;

  let billed = 0;
  let pending = 0;
  let activeContractsCount = 0;
  let nextDate: string | null = null;
  
  if (client.faturamento) {
    client.faturamento.forEach((f: any) => {
      const val = Number(f.amount) || 0;
      if (f.status === 'pago') billed += val;
      if (f.status === 'pendente' || f.status === 'atrasado') pending += val;
    });
  }

  if (client.contracts) {
    const activeContracts = client.contracts.filter((c: any) => c.status === 'ativo');
    activeContractsCount = activeContracts.length;
    
    const dates = activeContracts
      .map((c: any) => c.end_date)
      .filter(Boolean)
      .sort();
    if (dates.length > 0) nextDate = dates[0];
  }

  const enrichedClient: ClientWithMetrics = {
    ...client,
    user_id: client.user_id,
    status_manual: client.status_manual,
    updated_at: client.updated_at,
    total_billed: billed,
    total_pending: pending,
    active_contracts: activeContractsCount,
    next_due_date: nextDate,
  };

  return enrichedClient;
}

export async function getClientMetrics(userId: string) {
  const cacheKey = `alfred:${userId}:client-metrics`
  
  // Tenta buscar do cache primeiro
  const cached = await cacheGet<any>(cacheKey)
  if (cached) return cached

  const supabase = await createSupabaseServerClient();
  
  // Otimização: Busca apenas os counts agregados por status
  const [
    { count: total },
    { count: ativos },
    { count: inativos },
    { count: inadimplentes },
    { data: faturamentoData }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ativo'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'inativo'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'inadimplente'),
    supabase.from('faturamento').select('amount, status').eq('user_id', userId)
  ]);

  if (!total && total !== 0) throw new Error("Erro ao buscar métricas de clientes");

  let totalBilled = 0;
  let inadimplencyTotal = 0;
  
  faturamentoData?.forEach((f: any) => {
    const amount = Number(f.amount) || 0;
    if (f.status === 'pago') totalBilled += amount;
    if (f.status === 'pendente' || f.status === 'atrasado') inadimplencyTotal += amount;
  });

  const avgBilling = (total || 0) > 0 ? (totalBilled / (total || 1)) : 0;

  const metrics = {
    total: total || 0,
    ativos: ativos || 0,
    inativos: inativos || 0,
    inadimplentes: inadimplentes || 0,
    avg_billing: avgBilling,
    inadimplency_total: inadimplencyTotal,
    retention_rate: 0
  };

  // Salva no cache por 30 segundos
  await cacheSet(cacheKey, metrics, 30);

  return metrics;
}

export async function createClient(userId: string, data: ClientFormData) {
  const supabase = await createSupabaseServerClient();
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert([
      {
        ...data,
        user_id: userId,
        status: 'prospecto',
        inadimplency_score: 100,
      }
    ])
    .select()
    .single();

  if (error) throw error;

  // Invalida o cache ao criar novo cliente
  await cacheDelete(`alfred:${userId}:client-metrics`);

  return newClient;
}

export async function updateClient(userId: string, clientId: string, data: Partial<ClientFormData> & { status?: string, status_manual?: string | null }) {
  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', clientId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

export async function importClientsFromCSV(userId: string, rows: ClientFormData[]) {
  const supabase = await createSupabaseServerClient();
  
  const { data: existingClients } = await supabase
    .from('clients')
    .select('cpf_cnpj')
    .eq('user_id', userId);
  
  const existingDocs = new Set(existingClients?.filter((c: any) => c.cpf_cnpj).map((c: any) => c.cpf_cnpj));
  
  const toInsert = [];
  let skipped = 0;
  
  for (const row of rows) {
    if (row.cpf_cnpj && existingDocs.has(row.cpf_cnpj)) {
      skipped++;
    } else {
      toInsert.push({
        ...row,
        user_id: userId,
        status: 'prospecto',
        inadimplency_score: 100
      });
      if (row.cpf_cnpj) existingDocs.add(row.cpf_cnpj); 
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('clients').insert(toInsert);
    if (error) {
      return { imported: 0, skipped, errors: error.message };
    }
  }

  return { imported: toInsert.length, skipped, errors: null };
}
