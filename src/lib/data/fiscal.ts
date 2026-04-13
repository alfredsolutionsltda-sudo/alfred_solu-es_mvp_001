import { createClient } from '@/lib/supabase/server';
import { TaxRegime, FiscalMetrics, MonthlyProjection } from '@/types/fiscal';
import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache/redis';
import { ObrigacaoFiscal, Profile } from '@/types/database';
import { calculateMEI, calculateSimplesNacional, calculateLucroPresumido, calculateCarneLeao } from '../fiscal/tax-calculator';

export async function getObrigacoes(userId: string, year: number): Promise<ObrigacaoFiscal[]> {
  const cacheKey = `alfred:${userId}:obrigacoes-fiscal-${year}`
  
  // Tenta buscar do cache primeiro
  const cached = await cacheGet<ObrigacaoFiscal[]>(cacheKey)
  if (cached) return cached

  const supabase = await createClient();

  // 1. Busca obrigações existentes
  const { data, error } = await supabase
    .from('obrigacoes_fiscais')
    .select('id, user_id, client_id, name, description, amount, due_date, status, completed_at, paid_at, year, type, recorrente, recorrencia, created_at, updated_at')
    .eq('user_id', userId)
    .eq('year', year)
    .order('due_date', { ascending: true });

  if (error) throw error;

  // 2. Se não existirem, gera automaticamente para o primeiro acesso
  if (!data || data.length === 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tax_regime, average_ticket')
      .eq('id', userId)
      .single();

    if (profile && profile.tax_regime && profile.tax_regime !== 'Não definido') {
      // Gera obrigações para o ano atual baseadas no faturamento médio
      await generateObrigacoesForYear(
        userId, 
        profile.tax_regime as TaxRegime, 
        year, 
        profile.average_ticket || 5000 // Fallback se não tiver ticket médio
      );
      
      // Busca novamente após gerar
      const { data: freshData } = await supabase
        .from('obrigacoes_fiscais')
        .select('id, user_id, client_id, name, description, amount, due_date, status, completed_at, paid_at, year, type, recorrente, recorrencia, created_at, updated_at')
        .eq('user_id', userId)
        .eq('year', year)
        .order('due_date', { ascending: true });
        
      const result = freshData || [];
      await cacheSet(cacheKey, result, 3600); // 1 hora
      return result;
    }
  }

  const result = data || [];
  await cacheSet(cacheKey, result, 3600); // 1 hora
  return result;
}

export async function generateObrigacoesForYear(userId: string, regime: TaxRegime, year: number, averageMonthlyRevenue: number) {
  const supabase = await createClient();
  const obrigacoes: any[] = [];
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (let month = 1; month <= 12; month++) {
    let name = '';
    let amount = 0;
    
    // Calcula valor estimado baseado no regime
    if (regime === 'MEI') {
      name = 'DAS MEI';
      amount = calculateMEI(averageMonthlyRevenue, 'Serviços').total;
    } else if (regime === 'Simples Nacional') {
      name = 'DAS Simples';
      amount = calculateSimplesNacional(averageMonthlyRevenue, averageMonthlyRevenue * 12).total;
    } else if (regime === 'Lucro Presumido') {
      name = 'Guias LP (Trimestral/Mensal)';
      amount = calculateLucroPresumido(averageMonthlyRevenue).total;
    } else if (regime === 'Autônomo/Carnê-Leão') {
      name = 'Carnê-Leão + INSS';
      amount = calculateCarneLeao(averageMonthlyRevenue).total;
    }

    const dueDate = new Date(year, month - 1, 20); // Vence dia 20
    const status = (year < currentYear || (year === currentYear && month < currentMonth)) 
      ? 'pendente' 
      : (year === currentYear && month === currentMonth) ? 'pendente' : 'futuro';

    obrigacoes.push({
      user_id: userId,
      name,
      amount,
      due_date: dueDate.toISOString().split('T')[0],
      status,
      year,
      type: 'pagamento',
      recorrente: true,
      recorrencia: 'mensal'
    });
  }

  const { error } = await supabase
    .from('obrigacoes_fiscais')
    .insert(obrigacoes);

  if (error) throw error;
}

export async function getFiscalMetrics(userId: string): Promise<FiscalMetrics> {
  const cacheKey = `alfred:${userId}:fiscal-metrics`
  
  // Tenta buscar do cache primeiro
  const cached = await cacheGet<FiscalMetrics>(cacheKey)
  if (cached) return cached

  const supabase = await createClient();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 1. Busca obrigações do ano atual
  const { data: obrigações, error } = await supabase
    .from('obrigacoes_fiscais')
    .select('id, name, amount, due_date, status')
    .eq('user_id', userId)
    .eq('year', currentYear);

  if (error) throw error;

  // 2. Busca perfil para faturamento acumulado (limite MEI)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tax_regime')
    .eq('id', userId)
    .single();

  // Filtra métricas
  const currentMonthTax = obrigações?.find(o => {
    const d = new Date(o.due_date!);
    return d.getMonth() + 1 === currentMonth;
  });

  const totalPaidYear = obrigações?.filter(o => o.status === 'pago')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  const nextObrigaçao = obrigações?.filter(o => o.status === 'pendente')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];

  let daysRemaining = 0;
  if (nextObrigaçao) {
    const due = new Date(nextObrigaçao.due_date!);
    daysRemaining = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24)));
  }

  // Projeção: soma pagas + soma futuras estimadas
  const estimatedAnnual = obrigações?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  // Limite MEI (81k)
  const { data: faturamento } = await supabase
    .from('faturamento')
    .select('amount')
    .eq('user_id', userId)
    .gte('due_date', `${currentYear}-01-01`)
    .lte('due_date', `${currentYear}-12-31`)
    .eq('status', 'pago');
  
  const totalRevenue = faturamento?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const meiLimitPercent = (totalRevenue / 81000) * 100;

  const metrics: FiscalMetrics = {
    currentMonthTax: {
      value: currentMonthTax?.amount || 0,
      status: (currentMonthTax?.status as any) || 'pendente',
      label: currentMonthTax?.name || 'Sem guia este mês',
      dueDate: currentMonthTax?.due_date || null
    },
    totalPaidYear: {
      value: totalPaidYear,
      variation: 0 // No historical data yet
    },
    nextObligation: {
      daysRemaining,
      isUrgent: daysRemaining < 7,
      name: nextObrigaçao?.name || 'Nenhuma'
    },
    annualProjection: {
      estimatedTotal: estimatedAnnual,
      isBasedOnReal: totalPaidYear > 0
    },
    meiLimitPercent: profile?.tax_regime === 'MEI' ? meiLimitPercent : undefined
  };

  await cacheSet(cacheKey, metrics, 60);

  return metrics;
}

export async function getAnualProjection(userId: string, year: number): Promise<MonthlyProjection[]> {
  const supabase = await createClient();
  const { data: obrigações } = await supabase
    .from('obrigacoes_fiscais')
    .select('amount, due_date, status')
    .eq('user_id', userId)
    .eq('year', year)
    .order('due_date', { ascending: true });

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  
  return months.map((m, i) => {
    const obr = obrigações?.find(o => new Date(o.due_date!).getMonth() === i);
    const isFuture = (year > now.getFullYear()) || (year === now.getFullYear() && i > now.getMonth());
    const isCurrent = year === now.getFullYear() && i === now.getMonth();

    return {
      month: m,
      value: obr?.amount || 0,
      status: isFuture ? 'futuro' : (isCurrent ? 'atual' : 'concluido'),
      isPaid: obr?.status === 'pago'
    };
  });
}

export async function markObrigacaoAsPaid(userId: string, obrigacaoId: string, paidAt?: Date) {
  const supabase = await createClient();
  const dateStr = paidAt ? paidAt.toISOString() : new Date().toISOString();

  const { data, error } = await supabase
    .from('obrigacoes_fiscais')
    .update({ 
      status: 'pago', 
      paid_at: dateStr,
      completed_at: dateStr 
    })
    .eq('id', obrigacaoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // Invalida o cache ao marcar como paga
  await cacheDelete(
    `alfred:${userId}:fiscal-metrics`,
    `alfred:${userId}:obrigacoes-fiscal-${data.year}`
  );

  return data;
}
