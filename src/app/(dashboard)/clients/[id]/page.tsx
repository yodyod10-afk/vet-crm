import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientProfile } from '@/components/clients/client-profile'

export const metadata: Metadata = { title: 'Client Profile' }

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      primary_vet:profiles!clients_primary_vet_id_fkey(id, first_name, last_name),
      pets(id, name, species, breed, sex, date_of_birth, weight, weight_unit, is_deceased, avatar_url),
      invoices(id, invoice_number, status, total_amount, balance_due, issue_date)
    `)
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: vets } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'veterinarian')
    .eq('is_active', true)

  return <ClientProfile client={client as any} vets={vets ?? []} />
}
