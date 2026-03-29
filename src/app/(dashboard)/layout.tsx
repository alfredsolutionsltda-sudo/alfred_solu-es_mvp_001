import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import ScoreUpdater from '@/components/clients/ScoreUpdater'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca o perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <ScoreUpdater />
      <TopNav
        userEmail={user.email}
        userName={profile?.full_name ?? undefined}
      />
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
