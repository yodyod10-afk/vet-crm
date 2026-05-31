import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui/button-link'
import { formatDate, formatRelative } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'CRM / Leads' }

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-yellow-50 text-yellow-700',
  qualified: 'bg-purple-50 text-purple-700',
  converted: 'bg-green-50 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
}

export default async function CRMPage() {
  const supabase = await createClient()

  const { data: leadsRaw } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, stage, lead_source, pet_name, pet_species, created_at, notes')
    .order('created_at', { ascending: false })
    .limit(100)

  const leads = leadsRaw as any[] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM / Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Manage prospective clients and leads</p>
        </div>
        <ButtonLink href="/crm/new"><Plus className="w-4 h-4 mr-2" />Add Lead</ButtonLink>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-5 gap-3">
        {['new', 'contacted', 'qualified', 'converted', 'lost'].map(stage => {
          const count = leads.filter(l => l.stage === stage).length
          return (
            <div key={stage} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{stage}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No leads yet. Add your first lead to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pet</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.email && <div>{lead.email}</div>}
                    {lead.phone && <div>{lead.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {lead.pet_name ? `${lead.pet_name} (${lead.pet_species ?? 'pet'})` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STAGE_COLORS[lead.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{lead.lead_source ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{formatRelative(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
