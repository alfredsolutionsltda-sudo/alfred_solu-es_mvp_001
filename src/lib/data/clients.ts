import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { ClientFormData, ClientWithMetrics } from '@/types/clients';

export async function getClients(userId: string, filters?: { status?: string, search?: string, limit?: number, offset?: number }) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase.from('clients').select(`
    id, user_id, name, type, cpf_cnpj, status, status_manual, email, phone, company_name, cnpj, industry, notes, website, created_at, updated_at, inadimplency_score, alfred_context,
    faturamento ( amount, status ),
    contracts ( id, status, end_date, slug )
  `).eq('user_id', userId);

  if (filters?.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.limit) {
    const limit = filters.limit;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);
  }

  const { data: clientsData, error } = await query.order('name', { ascending: true });

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

  return enrichedClients;
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
  const supabase = await createSupabaseServerClient();
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, status, contracts(id, status)')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching client metrics:', error);
    throw new Error(`Erro ao calcular métricas de clientes: ${error.message}`);
  }

  const total = clients.length;
  let ativos = 0;
  let inativos = 0;
  let inadimplentes = 0;
  let repetidos = 0; 
  
  clients.forEach((c: any) => {
    if (c.status === 'ativo') ativos++;
    if (c.status === 'inativo') inativos++;
    if (c.status === 'inadimplente') inadimplentes++;
    if (c.contracts && c.contracts.length > 1) repetidos++;
  });

  const { data: faturamentos, error: fError } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId);
    
  if (fError) throw fError;
  
  let totalBilled = 0;
  let inadimplencyTotal = 0;
  
  faturamentos?.forEach((f: any) => {
    const amount = Number(f.amount) || 0;
    if (f.status === 'pago') {
      totalBilled += amount;
    }
    if (f.status === 'pendente' || f.status === 'atrasado') {
      inadimplencyTotal += amount;
    }
  });

  const avgBilling = total > 0 ? (totalBilled / total) : 0;
  const retentionRate = total > 0 ? Math.round((repetidos / total) * 100) : 0;

  return {
    total,
    ativos,
    inativos,
    inadimplentes,
    avg_billing: avgBilling,
    retention_rate: retentionRate,
    inadimplency_total: inadimplencyTotal
  };
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
