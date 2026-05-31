import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PetForm } from '@/components/pets/pet-form'

export const metadata: Metadata = { title: 'Add Pet' }

export default async function NewPetPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const { client_id } = await searchParams
  const supabase = await createClient()

  const [{ data: clientsRaw }, { data: vetsRaw }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .order('last_name'),
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'veterinarian')
      .eq('is_active', true)
      .order('last_name'),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Pet</h1>
        <p className="text-gray-500 text-sm mt-1">Register a new patient</p>
      </div>
      <PetForm
        clients={clientsRaw as any[] ?? []}
        vets={vetsRaw as any[] ?? []}
        defaultClientId={client_id}
      />
    </div>
  )
}
