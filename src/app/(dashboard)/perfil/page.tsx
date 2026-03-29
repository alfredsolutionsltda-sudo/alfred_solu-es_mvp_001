import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilePage from '@/components/profile/ProfilePage'
import { Profile } from '@/types/database'

export const metadata = {
  title: 'Meu Perfil | Alfred',
  description: 'Gerencie suas informações e preferências do Alfred.',
}

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca o perfil do usuário na tabela profiles
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Erro ao buscar perfil:', error)
    redirect('/onboarding')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return <ProfilePage profile={profile as Profile} />
}

