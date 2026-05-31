import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/button-link'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Billing' }

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: invoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total_amount, balance_due, issue_date, due_date, clients(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const invoices = invoicesRaw as any[]

  const stats = {
    total: invoices?.reduce((s: number, i: any) => s + i.total_amount, 0) ?? 0,
    paid: invoices?.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.total_amount, 0) ?? 0,
    outstanding: invoices?.filter((i: any) => ['sent','partial','overdue'].includes(i.status)).reduce((s: number, i: any) => s + i.balance_due, 0) ?? 0,
    overdue: invoices?.filter((i: any) => i.status === 'overdue').length ?? 0,
  }

  const STATUS_STYLES: Record<string, string> = {
    paid: 'bg-green-50 text-green-700',
    sent: 'bg-blue-50 text-blue-700',
    overdue: 'bg-red-50 text-red-700',
    partial: 'bg-yellow-50 text-yellow-700',
    draft: 'bg-gray-100 text-gray-600',
    void: 'bg-gray-100 text-gray-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <ButtonLink href="/billing/invoices/new"><Plus className="w-4 h-4 mr-2" />New Invoice</ButtonLink>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: formatCurrency(stats.total), color: 'text-gray-900' },
          { label: 'Collected', value: formatCurrency(stats.paid), color: 'text-green-600' },
          { label: 'Outstanding', value: formatCurrency(stats.outstanding), color: 'text-orange-600' },
          { label: 'Overdue Count', value: String(stats.overdue), color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!invoices?.length ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">No invoices yet</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/billing/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {inv.clients ? `${(inv.clients as any).first_name} ${(inv.clients as any).last_name}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(inv.issue_date)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status] ?? ''}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total_amount)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={inv.balance_due > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                    {formatCurrency(inv.balance_due)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/billing/invoices/${inv.id}`}>
                    <ArrowRight className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
