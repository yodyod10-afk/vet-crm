import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui/button-link'
import { formatDate, formatRelative } from '@/lib/utils'
import { FileText, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Medical Records' }

export default async function MedicalRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  const { data: recordsRaw } = await supabase
    .from('medical_records')
    .select(`
      id, visit_date, chief_complaint, is_locked, created_at,
      pets(id, name, species),
      clients(id, first_name, last_name),
      profiles!medical_records_veterinarian_id_fkey(first_name, last_name)
    `)
    .order('visit_date', { ascending: false })
    .limit(100)

  const records = recordsRaw as any[] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-500 text-sm mt-1">{records.length} records</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {records.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No medical records yet. Create one from a pet&apos;s profile.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Visit Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Chief Complaint</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Veterinarian</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {record.pets && (
                      <Link href={`/pets/${record.pets.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {record.pets.name}
                        <span className="text-xs text-gray-400 ml-1.5 capitalize">({record.pets.species})</span>
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {record.clients && (
                      <Link href={`/clients/${record.clients.id}`} className="hover:text-blue-600">
                        {record.clients.first_name} {record.clients.last_name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(record.visit_date)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <Link href={`/medical-records/${record.id}`} className="hover:text-blue-600">
                      {record.chief_complaint || <span className="text-gray-400 italic">No complaint noted</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {record.profiles ? `Dr. ${record.profiles.first_name} ${record.profiles.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {record.is_locked ? (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Lock className="w-3.5 h-3.5" />Locked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-orange-500">
                        <Unlock className="w-3.5 h-3.5" />Draft
                      </span>
                    )}
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
