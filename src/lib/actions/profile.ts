'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Atualiza os dados do perfil do usuário
 */
export async function updateProfile(userId: string, data: any) {
  const supabase = await createClient()

  // Remove campos que não devem ser atualizados diretamente ou são calculados
  const { id, email, created_at, updated_at, alfred_context, onboarding_completed, ...updateData } = data

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/perfil')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Exclui a conta do usuário e todos os dados relacionados
 * Usa Service Role para garantir deleção completa
 */
export async function deleteAccount(userId: string) {
  // Configuração do cliente admin com Service Role (apenas servidor)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
     return { success: false, error: 'Configuração de segurança ausente.' }
  }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 1. Deletar dados do usuário em cascata (RLS ou cascata do banco cuidam disso se configurado corretamente)
  // Mas vamos garantir deletando o usuário no auth
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    console.error('Erro ao excluir conta:', deleteError)
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}
