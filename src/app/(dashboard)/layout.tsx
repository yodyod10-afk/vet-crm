import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*, organizations(name, logo_url)')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as any
  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login?error=account_inactive')
  if (profile.role === 'client') redirect('/portal/dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar profile={profile as Profile & { organizations: { name: string; logo_url: string | null } }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile as Profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
