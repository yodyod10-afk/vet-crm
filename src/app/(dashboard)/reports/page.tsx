import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileRaw } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()
  const orgId = (profileRaw as any)?.organization_id ?? ''

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const [
    { count: apptCount },
    { count: newClients },
    { data: invoicesRaw },
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd)
      .not('status', 'in', '(cancelled,no_show)'),
    supabase.from('clients').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', monthStart),
    supabase.from('invoices').select('total_amount, status')
      .eq('organization_id', orgId)
      .gte('created_at', monthStart),
  ])

  const invoices = invoicesRaw as any[] ?? []
  const monthRevenue = invoices.filter(i => i.status !== 'void').reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0)
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Practice analytics and performance metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Appointments This Month', value: apptCount ?? 0 },
          { label: 'New Clients This Month', value: newClients ?? 0 },
          { label: 'Revenue This Month', value: formatCurrency(monthRevenue) },
          { label: 'Collected This Month', value: formatCurrency(paidRevenue) },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue Trend (6 months)</h2>
        <RevenueChart orgId={orgId} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
        More detailed reports coming soon — appointment types, species breakdown, vet performance, and more.
      </div>
    </div>
  )
}
