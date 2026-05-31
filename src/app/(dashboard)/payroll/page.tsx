import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Payroll' }

export default async function PayrollPage() {
  const supabase = await createClient()

  const { data: payrollRaw } = await supabase
    .from('payroll_records')
    .select('id, period_start, period_end, gross_pay, deductions, net_pay, status, profiles(first_name, last_name, role)')
    .order('period_start', { ascending: false })
    .limit(50)

  const records = payrollRaw as any[] ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="text-gray-500 text-sm mt-1">Staff compensation records</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {records.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No payroll records yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Staff Member</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Gross</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Deductions</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Net Pay</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.profiles?.first_name} {r.profiles?.last_name}
                    <span className="text-xs text-gray-400 ml-2 capitalize">{r.profiles?.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(r.period_start)} – {formatDate(r.period_end)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(r.gross_pay)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(r.deductions)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.net_pay)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${r.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
