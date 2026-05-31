import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui/button-link'
import { formatDate } from '@/lib/utils'
import { Plus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Vaccinations' }

export default async function VaccinationsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString()
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: vaccsRaw } = await supabase
    .from('vaccinations')
    .select(`
      id, vaccine_name, administered_date, next_due_date, lot_number, manufacturer,
      pets(id, name, species),
      clients(id, first_name, last_name)
    `)
    .order('next_due_date', { ascending: true, nullsFirst: false })
    .limit(200)

  const vaccs = vaccsRaw as any[] ?? []
  const overdue = vaccs.filter(v => v.next_due_date && v.next_due_date < today)
  const dueSoon = vaccs.filter(v => v.next_due_date && v.next_due_date >= today && v.next_due_date <= in30Days)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vaccinations</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage patient vaccination records</p>
        </div>
        <ButtonLink href="/vaccinations/new"><Plus className="w-4 h-4 mr-2" />Record Vaccine</ButtonLink>
      </div>

      {/* Alert banners */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            {overdue.length} overdue vaccination{overdue.length !== 1 ? 's' : ''} require attention
          </p>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-800 font-medium">
            {dueSoon.length} vaccination{dueSoon.length !== 1 ? 's' : ''} due within 30 days
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {vaccs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No vaccination records yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vaccine</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Administered</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Next Due</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lot #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vaccs.map(v => {
                const isOverdue = v.next_due_date && v.next_due_date < today
                const isDueSoon = !isOverdue && v.next_due_date && v.next_due_date <= in30Days
                return (
                  <tr key={v.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      {v.pets && (
                        <Link href={`/pets/${v.pets.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {v.pets.name}
                          <span className="text-xs text-gray-400 ml-1.5 capitalize">({v.pets.species})</span>
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.clients && (
                        <Link href={`/clients/${v.clients.id}`} className="hover:text-blue-600">
                          {v.clients.first_name} {v.clients.last_name}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{v.vaccine_name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(v.administered_date)}</td>
                    <td className="px-4 py-3">
                      {v.next_due_date ? (
                        <span className={isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-yellow-600 font-medium' : 'text-gray-600'}>
                          {formatDate(v.next_due_date)}
                          {isOverdue && ' ⚠'}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{v.lot_number ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
