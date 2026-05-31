import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OwnerDashboard } from '@/components/dashboard/owner-dashboard'
import { VetDashboard } from '@/components/dashboard/vet-dashboard'
import { ReceptionistDashboard } from '@/components/dashboard/receptionist-dashboard'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, first_name, organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string; first_name: string; organization_id: string } | null
  if (!profile) redirect('/login')

  if (profile.role === 'owner') return <OwnerDashboard userId={user.id} orgId={profile.organization_id} />
  if (profile.role === 'veterinarian') return <VetDashboard userId={user.id} firstName={profile.first_name} />
  return <ReceptionistDashboard orgId={profile.organization_id} />
}
