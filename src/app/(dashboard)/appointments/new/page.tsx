import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AppointmentForm } from '@/components/appointments/appointment-form'

export const metadata: Metadata = { title: 'New Appointment' }

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; pet_id?: string }>
}) {
  const { client_id, pet_id } = await searchParams
  const supabase = await createClient()

  const [{ data: vetsRaw }, { data: clientsRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'veterinarian')
      .eq('is_active', true)
      .order('last_name'),
    supabase
      .from('clients')
      .select('id, first_name, last_name, pets(id, name, species)')
      .eq('status', 'active')
      .order('last_name'),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
        <p className="text-gray-500 text-sm mt-1">Schedule a new appointment</p>
      </div>
      <AppointmentForm
        vets={vetsRaw as any[] ?? []}
        clients={clientsRaw as any[] ?? []}
        defaultClientId={client_id}
        defaultPetId={pet_id}
      />
    </div>
  )
}
