import { createClient } from '@/lib/supabase/server'
import { Contract, Faturamento } from '@/types/database'

export type DashboardPeriod = 'mes' | 'trimestre' | 'ano'

export function getPeriodDates(period: DashboardPeriod = 'mes') {
  const now = new Date()
  let start = new Date(now.getFullYear(), now.getMonth(), 1)
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  if (period === 'trimestre') {
    const quarter = Math.floor(now.getMonth() / 3)
    start = new Date(now.getFullYear(), quarter * 3, 1)
    end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
  } else if (period === 'ano') {
    start = new Date(now.getFullYear(), 0, 1)
    end = new Date(now.getFullYear(), 11, 31)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  }
}

export async function getDashboardMetrics(userId: string, period: DashboardPeriod = 'mes') {
  const supabase = await createClient()
  const { startDate, endDate } = getPeriodDates(period)
  
  // Contratos ativos
  const { count: activeContracts } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ativo')

  // Contratos vencendo em 30 dias
  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)
  const { count: expiringContracts } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .lte('end_date', in30Days.toISOString().split('T')[0])

  const { data: faturamentoData } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  let faturamentoPeriodo = 0;
  let inadimplenciaTotal = 0;
  let totalPendente = 0;

  faturamentoData?.forEach((f: any) => {
    const amount = Number(f.amount) || 0;
    if (f.status === 'pago') faturamentoPeriodo += amount;
    if (f.status === 'atrasado') inadimplenciaTotal += amount;
    if (f.status === 'pendente') totalPendente += amount;
  });

  // Clientes ativos
  const { count: clientesAtivos } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ativo')

  return {
    activeContracts: activeContracts || 0,
    expiringContracts: expiringContracts || 0,
    faturamentoPeriodo,
    totalPendente,
    clientesAtivos: clientesAtivos || 0,
    inadimplenciaTotal
  }
}

export async function getContractsWidget(userId: string, period: DashboardPeriod = 'mes') {
  const supabase = await createClient()
  const { startDate, endDate } = getPeriodDates(period)

  const [
    { count: gerados },
    { count: assinados },
    { count: ativos },
    { count: expirados },
    { data: expiringContracts }
  ] = await Promise.all([
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'assinado').gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ativo').gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'expirado').gte('created_at', startDate).lte('created_at', endDate),
    // Contratos ativos vencendo em 30 dias
    supabase.from('contracts').select('id').eq('user_id', userId).eq('status', 'ativo').gte('end_date', new Date().toISOString()).lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  const statuses = {
    gerados: gerados || 0,
    assinados: assinados || 0,
    ativos: ativos || 0,
    vencendo: expiringContracts?.length || 0,
    expirados: expirados || 0
  }

  return {
    statuses
  }
}

export async function getFaturamentoWidget(userId: string, period: DashboardPeriod = 'mes') {
  const supabase = await createClient()
  const { startDate, endDate } = getPeriodDates(period)

  const { data: faturamento } = await supabase
    .from('faturamento')
    .select('id, amount, type, status, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const safeFat = (faturamento || []) as Faturamento[]

  const total = safeFat.reduce((sum: number, f: Faturamento) => sum + Number(f.amount), 0)
  
  const breakdown = {
    honorario_fixo: safeFat.filter(f => f.type === 'honorarios_fixos').reduce((sum: number, f: Faturamento) => sum + Number(f.amount), 0),
    por_demanda: safeFat.filter(f => f.type === 'por_demanda').reduce((sum: number, f: Faturamento) => sum + Number(f.amount), 0),
    reembolso: safeFat.filter(f => f.type === 'reembolso').reduce((sum: number, f: Faturamento) => sum + Number(f.amount), 0),
  }

  return {
    total,
    breakdown: {
      honorario_fixo: { value: breakdown.honorario_fixo, percent: total > 0 ? (breakdown.honorario_fixo / total) * 100 : 0 },
      por_demanda: { value: breakdown.por_demanda, percent: total > 0 ? (breakdown.por_demanda / total) * 100 : 0 },
      reembolso: { value: breakdown.reembolso, percent: total > 0 ? (breakdown.reembolso / total) * 100 : 0 }
    }
  }
}

export async function getInadimplenciaWidget(userId: string) {
  const supabase = await createClient()
  
  // Histórico de 6 meses (fixo)
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  
  const { data: faturamento } = await supabase
    .from('faturamento')
    .select('amount, status, created_at')
    .eq('user_id', userId)
    .gte('created_at', sixMonthsAgo.toISOString())

  const safeFat = faturamento || []
  
  const byMonth: Record<string, { total: number, atrasado: number }> = {}
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = d.toISOString().substring(0, 7) // YYYY-MM
    byMonth[monthKey] = { total: 0, atrasado: 0 }
  }

  safeFat.forEach((f: any) => {
    const monthKey = f.created_at.substring(0, 7)
    if (byMonth[monthKey]) {
      const amount = Number(f.amount)
      byMonth[monthKey].total += amount
      if (f.status === 'atrasado') {
        byMonth[monthKey].atrasado += amount
      }
    }
  })

  // Calcula total geral atrasado do mes atual para o card principal
  const currentMonthKey = now.toISOString().substring(0, 7)
  const totalInadimplente = byMonth[currentMonthKey]?.atrasado || 0
  const totalFaturadoMes = byMonth[currentMonthKey]?.total || 0
  const percentage = totalFaturadoMes > 0 ? (totalInadimplente / totalFaturadoMes) * 100 : 0

  return {
    totalInadimplente,
    percentage,
    history: Object.keys(byMonth).sort().map(month => ({
      month,
      value: byMonth[month].atrasado
    }))
  }
}

export async function getCobrancasPendentes(userId: string, period: DashboardPeriod = 'mes') {
  const supabase = await createClient()
  const { startDate, endDate } = getPeriodDates(period)
  
  const { data } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId)
    .eq('status', 'pendente')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const pendentes = data || []
  const total = pendentes.reduce((sum: number, f: any) => sum + Number(f.amount), 0)

  // Variation calc against previous period (same size)
  const currentStart = new Date(startDate)
  const currentEnd = new Date(endDate)
  const duration = currentEnd.getTime() - currentStart.getTime()
  
  const priorStart = new Date(currentStart.getTime() - duration)
  const priorEnd = new Date(currentStart.getTime() - 1)

  const { data: priorData } = await supabase
    .from('faturamento')
    .select('amount, status')
    .eq('user_id', userId)
    .eq('status', 'pendente')
    .gte('created_at', priorStart.toISOString())
    .lte('created_at', priorEnd.toISOString())

  const priorPendentes = priorData || []
  const priorTotal = priorPendentes.reduce((sum: number, f: any) => sum + Number(f.amount), 0)

  const variation = priorTotal > 0 ? ((total - priorTotal) / priorTotal) * 100 : (total > 0 ? 100 : 0)

  return {
    total,
    variation
  }
}

export async function getClientesAtivos(userId: string, period: DashboardPeriod = 'mes') {
  const supabase = await createClient()
  const { startDate, endDate } = getPeriodDates(period)

  const { count: totalAtivos } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ativo')

  const { count: novosNoPeriodo } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  return {
    totalAtivos: totalAtivos || 0,
    novosNoPeriodo: novosNoPeriodo || 0
  }
}
