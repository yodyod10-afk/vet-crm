import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { ButtonLink } from '@/components/ui/button-link'
import { UserPlus } from 'lucide-react'

export const metadata: Metadata = { title: 'Clients' }

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const { q, status, page } = await searchParams
  const supabase = await createClient()
  const pageNum = Number(page ?? 1)
  const pageSize = 25
  const offset = (pageNum - 1) * pageSize

  let query = supabase
    .from('clients')
    .select('id, first_name, last_name, email, phone_primary, status, balance_due, created_at, primary_vet_id, pets!pets_client_id_fkey(id)', { count: 'exact' })
    .order('last_name', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone_primary.ilike.%${q}%`)

  const { data: clientsRaw, count } = await query
  const clients = clientsRaw as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{count ?? 0} total clients</p>
        </div>
        <ButtonLink href="/clients/new"><UserPlus className="w-4 h-4 mr-2" />New Client</ButtonLink>
      </div>
      <ClientsTable clients={clients ?? []} total={count ?? 0} page={pageNum} pageSize={pageSize} />
    </div>
  )
}
