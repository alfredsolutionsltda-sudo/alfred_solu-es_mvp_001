import { createClient } from '@supabase/supabase-js'

export async function updateContractStatuses() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]

  const em30Dias = new Date()
  em30Dias.setDate(em30Dias.getDate() + 30)
  const em30DiasStr = em30Dias.toISOString().split('T')[0]

  // Contratos ativos com end_date entre hoje e +30 dias → vencendo
  const { error: vencendoError } = await supabase
    .from('contracts')
    .update({ status: 'vencendo' })
    .eq('status', 'ativo')
    .gte('end_date', hojeStr)
    .lte('end_date', em30DiasStr)

  if (vencendoError) {
    console.error('Erro ao atualizar contratos vencendo:', vencendoError)
  }

  // Contratos ativos/vencendo com end_date < hoje → expirado
  const { error: expiradoError } = await supabase
    .from('contracts')
    .update({ status: 'expirado' })
    .in('status', ['ativo', 'vencendo'])
    .lt('end_date', hojeStr)

  if (expiradoError) {
    console.error('Erro ao atualizar contratos expirados:', expiradoError)
  }
}
