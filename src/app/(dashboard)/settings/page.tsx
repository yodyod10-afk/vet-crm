import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SettingsPage } from '@/components/settings/settings-page'

export const metadata: Metadata = { title: 'Settings' }

export default async function Settings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*, organizations(id, name, phone, email, address_line1, address_line2, city, state, zip, website, logo_url, timezone)')
    .eq('id', user!.id)
    .single()

  return <SettingsPage profile={profileRaw as any} />
}
