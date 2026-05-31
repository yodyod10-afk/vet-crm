import { createClient } from '@/lib/supabase/server'
import { StatsCard } from './stats-card'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import {
  DollarSign, Users, Heart, Calendar, AlertCircle,
  TrendingUp, Clock
} from 'lucide-react'
import { RevenueChart } from './revenue-chart'
import { AppointmentsToday } from './appointments-today'
import { startOfMonth, endOfMonth } from 'date-fns'

interface OwnerDashboardProps {
  userId: string
  orgId: string
}

export async function OwnerDashboard({ orgId }: OwnerDashboardProps) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()
  const todayStart = new Date(now.setHours(0,0,0,0)).toISOString()
  const todayEnd = new Date(now.setHours(23,59,59,999)).toISOString()

  const [
    { count: totalClients },
    { count: totalPets },
    { count: todayAppts },
    { data: invoicesRaw },
    { data: todayAppointments },
    { data: vetsRaw },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('pets').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_deceased', false),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)'),
    supabase.from('invoices').select('total_amount, balance_due, status, paid_amount')
      .eq('organization_id', orgId)
      .gte('issue_date', monthStart.split('T')[0]).lte('issue_date', monthEnd.split('T')[0]),
    supabase.from('appointments')
      .select('id, title, appointment_type, scheduled_at, status, duration_minutes, pets(name, species), clients(first_name, last_name), profiles!appointments_veterinarian_id_fkey(first_name, last_name)')
      .eq('organization_id', orgId)
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at'),
    supabase.from('profiles').select('id, first_name, last_name')
      .eq('organization_id', orgId).eq('role', 'veterinarian').eq('is_active', true),
  ])

  const invoices = invoicesRaw as any[]
  const vets = vetsRaw as any[]

  const monthRevenue = invoices?.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0) ?? 0
  const outstandingBalance = invoices?.reduce((s: number, i: any) =>
    ['sent','partial','overdue'].includes(i.status) ? s + i.balance_due : s, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(new Date().toISOString(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue (this month)"
          value={formatCurrency(monthRevenue)}
          icon={DollarSign}
          iconColor="text-green-600"
          change="+12.5% vs last month"
          changeType="positive"
        />
        <StatsCard
          title="Today's Appointments"
          value={todayAppts ?? 0}
          icon={Calendar}
          iconColor="text-blue-600"
          description="scheduled today"
        />
        <StatsCard
          title="Active Clients"
          value={totalClients ?? 0}
          icon={Users}
          iconColor="text-purple-600"
          description="total clients"
        />
        <StatsCard
          title="Outstanding Balance"
          value={formatCurrency(outstandingBalance)}
          icon={AlertCircle}
          iconColor="text-orange-600"
          description="across all invoices"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <RevenueChart orgId={orgId} />
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today&apos;s Schedule</h2>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <AppointmentsToday appointments={todayAppointments ?? []} />
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active pets */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">Active Pets</h2>
            <span className="ml-auto text-2xl font-bold text-gray-900">{totalPets ?? 0}</span>
          </div>
          <p className="text-sm text-gray-500">Total pets under care</p>
        </div>

        {/* Vet list */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Veterinarians On Staff</h2>
          <div className="space-y-2">
            {vets?.map(v => (
              <div key={v.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                  {v.first_name[0]}{v.last_name[0]}
                </div>
                <span className="text-sm font-medium text-gray-700">Dr. {v.first_name} {v.last_name}</span>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}
            {!vets?.length && <p className="text-sm text-gray-400">No veterinarians on staff</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
