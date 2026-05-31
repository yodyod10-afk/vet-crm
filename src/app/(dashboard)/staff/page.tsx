import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StaffList } from '@/components/staff/staff-list'

export const metadata: Metadata = { title: 'Staff Management' }

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: staffRaw } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active, created_at, phone, avatar_url')
    .neq('role', 'client')
    .order('role')
    .order('last_name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your team members and their access</p>
      </div>
      <StaffList staff={staffRaw as any[] ?? []} />
    </div>
  )
}
