import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/clients/client-form'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'New Client' }

export default async function NewClientPage() {
  const supabase = await createClient()
  const { data: vets } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'veterinarian')
    .eq('is_active', true)
    .order('last_name')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new client to the practice</p>
      </div>
      <ClientForm vets={vets ?? []} />
    </div>
  )
}
