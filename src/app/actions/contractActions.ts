'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
