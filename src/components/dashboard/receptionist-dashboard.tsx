import { createClient } from '@/lib/supabase/server'
import { StatsCard } from './stats-card'
import { AppointmentsToday } from './appointments-today'
import { Calendar, Users, CreditCard, UserPlus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export async function ReceptionistDashboard({ orgId }: { orgId: string }) {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.setHours(0,0,0,0)).toISOString()
  const todayEnd = new Date(now.setHours(23,59,59,999)).toISOString()

  const [
    { count: todayAppts },
    { count: totalClients },
    { data: overdueInvoicesRaw },
    { data: todayAppointments },
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)'),
    supabase.from('clients').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('invoices').select('balance_due')
      .eq('organization_id', orgId)
      .in('status', ['overdue', 'sent']),
    supabase.from('appointments')
      .select('id, title, appointment_type, scheduled_at, status, duration_minutes, pets(name, species), clients(first_name, last_name), profiles!appointments_veterinarian_id_fkey(first_name, last_name)')
      .eq('organization_id', orgId)
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at'),
  ])

  const overdueInvoices = overdueInvoicesRaw as any[]
  const overdueTotal = overdueInvoices?.reduce((s: number, i: any) => s + i.balance_due, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(new Date().toISOString(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Today's Appointments" value={todayAppts ?? 0} icon={Calendar} iconColor="text-blue-600" />
        <StatsCard title="Active Clients" value={totalClients ?? 0} icon={Users} iconColor="text-purple-600" />
        <StatsCard title="Outstanding Invoices" value={formatCurrency(overdueTotal)} icon={CreditCard} iconColor="text-orange-600" />
        <StatsCard title="Check-ins Today" value="0" icon={UserPlus} iconColor="text-green-600" description="awaiting" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h2>
        <AppointmentsToday appointments={todayAppointments ?? []} />
      </div>
    </div>
  )
}
