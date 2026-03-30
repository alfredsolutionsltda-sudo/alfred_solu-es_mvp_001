'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getContractAlerts } from '@/lib/data/contracts'

export async function updateContractStatusAction(
  userId: string,
  contractId: string,
  status: string
) {
  try {
    const supabase = await createClient()

    // Verifica se o usuário tem permissão
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return { success: false, error: 'Não autorizado' }
    }

    const { error } = await supabase
      .from('contracts')
      .update({ status })
      .eq('id', contractId)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao atualizar status do contrato:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/contracts')
    revalidatePath(`/dashboard/proposals`)
    
    return { success: true }
  } catch (error: any) {
    console.error('Erro na action de contrato:', error)
    return { success: false, error: error.message || 'Erro interno' }
  }
}

export async function incrementReadingTimeAction(slug: string, seconds: number) {
  try {
    const supabase = await createClient()
    
    // Usamos o RPC definido na migração para evitar race conditions no total_reading_time
    const { error } = await supabase.rpc('increment_reading_time', {
      p_slug: slug,
      p_seconds: seconds
    })

    if (error) {
      console.error('Erro ao incrementar tempo de leitura:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno' }
  }
}

export async function rejectProposalAction(slug: string, reason: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('reject_proposal_by_slug', {
      p_slug: slug,
      p_reason: reason
    })

    if (error) {
      console.error('Erro ao rejeitar proposta:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/contrato/${slug}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno' }
  }
}

export async function getContractAlertsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Não autenticado' }

    const alerts = await getContractAlerts(user.id)
    return { success: true, count: alerts.length, data: alerts }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao carregar alertas' }
  }
}
