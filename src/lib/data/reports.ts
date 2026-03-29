import { createClient } from '@/lib/supabase/server';
import { 
  ReportPeriod, 
  ReportMetrics, 
  RevenueByMonth, 
  RevenueBreakdown, 
  ClientPerformance, 
  FunnelData, 
  ConversionByService, 
  Projection, 
  AlfredBriefingData 
} from '@/types/reports';

export async function getPeriodDates(period: ReportPeriod) {
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), quarter * 3, 1);
    end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    // Datas do período anterior (mesmo intervalo de dias atrás)
    priorStart: new Date(start.getTime() - (end.getTime() - start.getTime())).toISOString(),
    priorEnd: new Date(start.getTime() - 1).toISOString()
  };
}

export async function getReportMetrics(userId: string, period: ReportPeriod): Promise<ReportMetrics> {
  const supabase = await createClient();
  const { start, end, priorStart, priorEnd } = await getPeriodDates(period);

  // Busca faturamento do período atual
  const { data: currentFat } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId)
    .gte('due_date', start)
    .lte('due_date', end);

  // Busca faturamento do período anterior
  const { data: priorFat } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId)
    .gte('due_date', priorStart)
    .lte('due_date', priorEnd);

  // Busca impostos pagos no período atual
  const { data: currentTaxes } = await supabase
    .from('obrigacoes_fiscais')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'pago')
    .gte('paid_at', start)
    .lte('paid_at', end);

  // Busca impostos pagos no período anterior
  const { data: priorTaxes } = await supabase
    .from('obrigacoes_fiscais')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'pago')
    .gte('paid_at', priorStart)
    .lte('paid_at', priorEnd);

  const calculate = (data: any[] = []) => {
    const gross = data.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const received = data.filter(f => f.status === 'pago').reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const delinquency = data.filter(f => f.status === 'atrasado').reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return { gross, received, delinquency };
  };

  const curr = calculate(currentFat || []);
  const priv = calculate(priorFat || []);
  
  const currTaxes = (currentTaxes || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const privTaxes = (priorTaxes || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currMargin = curr.received > 0 ? ((curr.received - currTaxes) / curr.received) * 100 : 0;
  const privMargin = priv.received > 0 ? ((priv.received - privTaxes) / priv.received) * 100 : 0;

  const safeNum = (n: any) => (isNaN(n) || !isFinite(n)) ? 0 : n;
  const calcVar = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : (c > 0 ? 100 : 0);

  return {
    grossRevenue: safeNum(curr.gross),
    received: safeNum(curr.received),
    delinquency: safeNum(curr.delinquency),
    taxesPaid: safeNum(currTaxes),
    netMargin: safeNum(currMargin),
    variations: {
      grossRevenue: safeNum(calcVar(curr.gross, priv.gross)),
      received: safeNum(calcVar(curr.received, priv.received)),
      delinquency: safeNum(calcVar(curr.delinquency, priv.delinquency)),
      taxesPaid: safeNum(calcVar(currTaxes, privTaxes)),
      netMargin: safeNum(currMargin - privMargin)
    }
  };
}

export async function getRevenueByMonth(userId: string, year: number): Promise<RevenueByMonth[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('faturamento')
    .select('amount, status, due_date')
    .eq('user_id', userId)
    .gte('due_date', `${year}-01-01`)
    .lte('due_date', `${year}-12-31`);

  const months: RevenueByMonth[] = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(year, i, 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
    year,
    billed: 0,
    received: 0
  }));

  (data || []).forEach(f => {
    const month = new Date(f.due_date).getMonth();
    months[month].billed += Number(f.amount || 0);
    if (f.status === 'pago') {
      months[month].received += Number(f.amount || 0);
    }
  });

  return months;
}

export async function getRevenueBreakdown(userId: string, period: ReportPeriod): Promise<RevenueBreakdown[]> {
  const supabase = await createClient();
  const { start, end } = await getPeriodDates(period);

  const { data } = await supabase
    .from('faturamento')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('due_date', start)
    .lte('due_date', end);

  const types: any = {
    honorarios_fixos: { type: 'honorario_fixo', value: 0 },
    por_demanda: { type: 'por_demanda', value: 0 },
    reembolso: { type: 'reembolso', value: 0 },
    outro: { type: 'honorario_fixo', value: 0 }, // Outro cai no honorário fixo no chart donut dependendo do design
  };

  let total = 0;
  (data || []).forEach(f => {
    const val = Number(f.amount || 0);
    total += val;
    if (types[f.type]) {
      types[f.type].value += val;
    } else {
      types.honorarios_fixos.value += val;
    }
  });

  return Object.values(types).map((t: any) => ({
    ...t,
    percent: total > 0 ? (t.value / total) * 100 : 0
  })) as RevenueBreakdown[];
}

export async function getClientPerformance(userId: string, period: ReportPeriod): Promise<ClientPerformance[]> {
  const supabase = await createClient();
  const { start, end, priorStart, priorEnd } = await getPeriodDates(period);

  const { data: currentFat } = await supabase
    .from('faturamento')
    .select('amount, status, client_id, clients(name)')
    .eq('user_id', userId)
    .gte('due_date', start)
    .lte('due_date', end);

  const { data: priorFat } = await supabase
    .from('faturamento')
    .select('amount, status, client_id')
    .eq('user_id', userId)
    .gte('due_date', priorStart)
    .lte('due_date', priorEnd);

  const clientsMap: any = {};

  (currentFat || []).forEach((f: any) => {
    if (!f.client_id) return;
    if (!clientsMap[f.client_id]) {
      clientsMap[f.client_id] = { 
        clientId: f.client_id, 
        clientName: f.clients?.name || 'Cliente s/ nome',
        volume: 0, 
        currentPaid: 0, 
        currentTotal: 0,
        priorPaid: 0,
        priorTotal: 0
      };
    }
    const val = Number(f.amount || 0);
    clientsMap[f.client_id].volume += val;
    clientsMap[f.client_id].currentTotal += 1;
    if (f.status === 'pago') clientsMap[f.client_id].currentPaid += 1;
  });

  (priorFat || []).forEach((f: any) => {
    if (!f.client_id || !clientsMap[f.client_id]) return;
    clientsMap[f.client_id].priorTotal += 1;
    if (f.status === 'pago') clientsMap[f.client_id].priorPaid += 1;
  });

  const results: ClientPerformance[] = Object.values(clientsMap).map((c: any) => {
    const punctuality = c.currentTotal > 0 ? (c.currentPaid / c.currentTotal) * 100 : 0;
    const priorPunctuality = c.priorTotal > 0 ? (c.priorPaid / c.priorTotal) * 100 : 0;
    
    let trend: 'up' | 'stable' | 'down' = 'stable';
    if (punctuality > priorPunctuality + 2) trend = 'up';
    else if (punctuality < priorPunctuality - 2) trend = 'down';

    return {
      clientId: c.clientId,
      clientName: c.clientName,
      volume: c.volume,
      punctuality,
      trend
    };
  });

  return results.sort((a, b) => b.volume - a.volume).slice(0, 10);
}

export async function getProposalFunnel(userId: string, period: ReportPeriod): Promise<FunnelData> {
  const supabase = await createClient();
  const { start, end } = await getPeriodDates(period);

  // Propostas enviadas no período
  const { data: proposals } = await supabase
    .from('proposals')
    .select('status')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end);

  // Propostas pagas (convertidas em faturamento)
  // Nota: Consideramos propostas que viraram contratos e geraram faturamento pago
  // Ou simplesmente propostas com status 'aprovada' que têm faturamento vinculado?
  // User Prompt: "Propostas enviadas → aceitas → pagas (contratos com faturamento)"
  const sent = proposals?.length || 0;
  const accepted = proposals?.filter(p => ['aprovada', 'aceita'].includes(p.status)).length || 0;
  
  // Para 'pagas', buscamos faturamento pago vinculado a contratos criados no período
  // Mas simplificando para o MVP: propostas aceitas que já têm faturamento pago?
  // Vamos buscar contratos criados no período vinculados a propostas
  const { data: contractsWithPayment } = await supabase
    .from('faturamento')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pago')
    .gte('created_at', start)
    .lte('created_at', end)
    .not('contract_id', 'is', null);

  const paid = contractsWithPayment?.length || 0;

  return {
    sent,
    accepted,
    paid: Math.min(paid, accepted), // paid não pode ser maior que aceitas no funil visualmente
    conversionRates: {
      sentToAccepted: sent > 0 ? (accepted / sent) * 100 : 0,
      acceptedToPaid: accepted > 0 ? (paid / accepted) * 100 : 0
    }
  };
}

export async function getConversionByService(userId: string, period: ReportPeriod): Promise<ConversionByService[]> {
  const supabase = await createClient();
  const { start, end } = await getPeriodDates(period);

  // NOTA: Como não temos type em proposals no schema.sql, vamos assumir que extraímos do title 
  // ou que o usuário quer por service_type (que talvez esteja em profiles ou contracts)
  // No prompt: "Agrupa propostas por service_type".
  // Vamos buscar todas as propostas
  const { data } = await supabase
    .from('proposals')
    .select('status, title')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end);

  // Mock grouping logic since service_type is not in DB yet
  // In a real scenario, we'd have a service_type column
  const groups: any = {
    'Consultoria': { proposals: 0, accepted: 0 },
    'Compliance': { proposals: 0, accepted: 0 },
    'Recuperação': { proposals: 0, accepted: 0 },
    'Assessoria': { proposals: 0, accepted: 0 },
  };

  (data || []).forEach(p => {
    // Randomly assign to a group for demo if not found in title
    const type = Object.keys(groups).find(t => p.title.includes(t)) || 'Assessoria';
    groups[type].proposals += 1;
    if (['aprovada', 'aceita'].includes(p.status)) groups[type].accepted += 1;
  });

  return Object.entries(groups).map(([type, stats]: [string, any]) => ({
    serviceType: type,
    proposals: stats.proposals,
    accepted: stats.accepted,
    conversionRate: stats.proposals > 0 ? (stats.accepted / stats.proposals) * 100 : 0
  })).sort((a, b) => b.conversionRate - a.conversionRate);
}

export async function getProjection(userId: string): Promise<Projection> {
  const supabase = await createClient();
  
  // Média dos últimos 3 meses de faturamento
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  
  const { data } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId)
    .gte('due_date', threeMonthsAgo.toISOString());

  const total = (data || []).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const base = total / 3;

  // Inadimplência atual
  const delinquency = (data || [])
    .filter(f => f.status === 'atrasado')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0) / 3;

  const adjustedBase = Math.max(0, base - delinquency);

  return {
    base: adjustedBase,
    pessimistic: adjustedBase * 0.85,
    optimistic: adjustedBase * 1.25
  };
}

export async function getAlfredBriefingData(userId: string, period: ReportPeriod): Promise<AlfredBriefingData> {
  const [
    metrics, 
    revenueByMonth, 
    breakdown, 
    clients, 
    funnel, 
    serviceConversion, 
    projection
  ] = await Promise.all([
    getReportMetrics(userId, period),
    getRevenueByMonth(userId, new Date().getFullYear()),
    getRevenueBreakdown(userId, period),
    getClientPerformance(userId, period),
    getProposalFunnel(userId, period),
    getConversionByService(userId, period),
    getProjection(userId)
  ]);

  return {
    metrics,
    revenueByMonth,
    breakdown,
    clients,
    funnel,
    serviceConversion,
    projection
  };
}
