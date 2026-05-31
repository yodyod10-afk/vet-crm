import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppointmentDetail } from '@/components/appointments/appointment-detail'

export const metadata: Metadata = { title: 'Appointment' }

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: apptRaw }, { data: vetsRaw }] = await Promise.all([
    supabase
      .from('appointments')
      .select(`
        id, scheduled_at, duration_minutes, appointment_type, status, title, notes, room,
        reason, created_at,
        pets(id, name, species, breed),
        clients(id, first_name, last_name, email, phone_primary),
        profiles!appointments_veterinarian_id_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'veterinarian')
      .eq('is_active', true)
      .order('last_name'),
  ])

  if (!apptRaw) notFound()

  return (
    <AppointmentDetail
      appointment={apptRaw as any}
      vets={vetsRaw as any[] ?? []}
    />
  )
}
