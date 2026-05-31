import { createClient } from '@/lib/supabase/server'
import { StatsCard } from './stats-card'
import { AppointmentsToday } from './appointments-today'
import { Calendar, Users, FileText, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export async function VetDashboard({ userId, firstName }: { userId: string; firstName: string }) {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.setHours(0,0,0,0)).toISOString()
  const todayEnd = new Date(now.setHours(23,59,59,999)).toISOString()

  const [
    { count: myClients },
    { count: todayAppts },
    { count: pendingRecords },
    { data: todayAppointments },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('primary_vet_id', userId),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('veterinarian_id', userId)
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)'),
    supabase.from('medical_records').select('*', { count: 'exact', head: true })
      .eq('veterinarian_id', userId).eq('is_locked', false),
    supabase.from('appointments')
      .select('id, title, appointment_type, scheduled_at, status, duration_minutes, pets(name, species), clients(first_name, last_name), profiles!appointments_veterinarian_id_fkey(first_name, last_name)')
      .eq('veterinarian_id', userId)
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, Dr. {firstName}</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(new Date().toISOString(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Today's Appointments" value={todayAppts ?? 0} icon={Calendar} iconColor="text-blue-600" description="on your schedule" />
        <StatsCard title="My Clients" value={myClients ?? 0} icon={Users} iconColor="text-purple-600" description="assigned to you" />
        <StatsCard title="Unlocked Records" value={pendingRecords ?? 0} icon={FileText} iconColor="text-orange-600" description="need attention" />
        <StatsCard title="Next Appointment" value="Soon" icon={Clock} iconColor="text-green-600" description="check calendar" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h2>
        <AppointmentsToday appointments={todayAppointments ?? []} />
      </div>
    </div>
  )
}
