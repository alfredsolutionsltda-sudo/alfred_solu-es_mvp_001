import { createClient } from '@/lib/supabase/server'

export async function getBriefingData(userId: string) {
  const supabase = await createClient()

  const in7Days = new Date()
  in7Days.setDate(in7Days.getDate() + 7)

  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)

  const ago7Days = new Date()
  ago7Days.setDate(ago7Days.getDate() - 7)

  const ago3Days = new Date()
  ago3Days.setDate(ago3Days.getDate() - 3)

  // 1. Contratos vencendo em até 7 dias
  const { data: contratosVencendo } = await supabase
    .from('contracts')
    .select('title, end_date')
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .lte('end_date', in7Days.toISOString().split('T')[0])

  // 2. Clientes inadimplentes há mais de 7 dias
  const { data: inadimplentes } = await supabase
    .from('faturamento')
    .select('description, amount, due_date, clients(name)')
    .eq('user_id', userId)
    .eq('status', 'atrasado')
    .lte('due_date', ago7Days.toISOString().split('T')[0])

  // 3. Propostas sem resposta há mais de 7 dias
  const { data: propostasSemResposta } = await supabase
    .from('contracts')
    .select('title, created_at, clients(name)')
    .eq('user_id', userId)
    .eq('status', 'pendente_assinatura')
    .lte('created_at', ago7Days.toISOString())

  // 4. DAS ou obrigação fiscal vencendo em até 7 dias
  const { data: obrigacoesVencendo } = await supabase
    .from('obrigacoes_fiscais')
    .select('name, due_date')
    .eq('user_id', userId)
    .eq('status', 'pendente')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .lte('due_date', in7Days.toISOString().split('T')[0])

  // 5. Contratos pendentes de assinatura há mais de 3 dias
  const { data: contratosPendentes } = await supabase
    .from('contracts')
    .select('title, created_at')
    .eq('user_id', userId)
    .eq('status', 'enviado')
    .lte('created_at', ago3Days.toISOString())

  return {
    contratosVencendo: contratosVencendo || [],
    inadimplentes: inadimplentes || [],
    propostasSemResposta: propostasSemResposta || [],
    obrigacoesVencendo: obrigacoesVencendo || [],
    contratosPendentes: contratosPendentes || []
  }
}
