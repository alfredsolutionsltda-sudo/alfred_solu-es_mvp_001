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

  // Faturamento e Inadimplencia (filtered by period)
  // Otimizado: Busca apenas somas parciais para evitar carregar milhares de linhas
  const [
    { data: pagoData },
    { data: atrasadoData },
    { data: pendenteData }
  ] = await Promise.all([
    supabase.from('faturamento').select('amount').eq('user_id', userId).eq('status', 'pago').gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('faturamento').select('amount').eq('user_id', userId).eq('status', 'atrasado').gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('faturamento').select('amount').eq('user_id', userId).eq('status', 'pendente').gte('created_at', startDate).lte('created_at', endDate)
  ]);

  const faturamentoPeriodo = pagoData?.reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;
  const inadimplenciaTotal = atrasadoData?.reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;
  const totalPendente = pendenteData?.reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;

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

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, status, end_date, created_at, value, client_id')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  const safeContracts = (contracts || []) as Contract[]

  const statuses = {
    gerados: safeContracts.length,
    assinados: safeContracts.filter(c => c.status === 'assinado').length,
    ativos: safeContracts.filter(c => c.status === 'ativo').length,
    vencendo: safeContracts.filter(c => {
      if (!c.end_date) return false
      const end = new Date(c.end_date)
      const now = new Date()
      const diffInfoDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24)
      return diffInfoDays <= 30 && diffInfoDays >= 0 && c.status === 'ativo'
    }).length,
    expirados: safeContracts.filter(c => c.status === 'expirado').length
  }

  const latestContracts = safeContracts.slice(0, 5)

  return {
    statuses,
    latestContracts
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
