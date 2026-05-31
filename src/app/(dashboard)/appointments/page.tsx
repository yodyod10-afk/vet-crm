import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { ButtonLink } from '@/components/ui/button-link'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Appointments' }

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const { view = 'week', date } = await searchParams
  const supabase = await createClient()

  // Load current user to determine vet filter
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()
  const profile = profileRaw as { role: string } | null

  // Fetch all active vets for filter
  const { data: vetsRaw } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'veterinarian')
    .eq('is_active', true)
    .order('last_name')

  // Fetch appointments (RLS handles vet-specific filtering automatically)
  const focusDate = date ? new Date(date) : new Date()
  const startOfWeek = new Date(focusDate)
  startOfWeek.setDate(focusDate.getDate() - focusDate.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfView = new Date(startOfWeek)
  endOfView.setDate(startOfWeek.getDate() + (view === 'month' ? 42 : view === 'week' ? 7 : 1))

  const vets = vetsRaw as any[]

  const { data: appointmentsRaw } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, duration_minutes, appointment_type, status, title, room,
      pets(id, name, species),
      clients(id, first_name, last_name),
      profiles!appointments_veterinarian_id_fkey(id, first_name, last_name)
    `)
    .gte('scheduled_at', startOfWeek.toISOString())
    .lt('scheduled_at', endOfView.toISOString())
    .order('scheduled_at')
  const appointments = appointmentsRaw as any[]

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <ButtonLink href="/appointments/new"><Plus className="w-4 h-4 mr-2" />New Appointment</ButtonLink>
      </div>
      <div className="flex-1">
        <AppointmentCalendar
          appointments={appointments ?? []}
          vets={vets ?? []}
          initialView={view as 'day' | 'week' | 'month'}
          initialDate={focusDate.toISOString()}
          userRole={profile?.role ?? 'receptionist'}
        />
      </div>
    </div>
  )
}
