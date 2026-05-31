import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { InvoiceBuilder } from '@/components/billing/invoice-builder'

export const metadata: Metadata = { title: 'New Invoice' }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; appointment_id?: string }>
}) {
  const { client_id, appointment_id } = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email, balance_due')
    .eq('status', 'active')
    .order('last_name')

  let defaultClient = null
  if (client_id) {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email')
      .eq('id', client_id)
      .single()
    defaultClient = data
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new invoice for a client</p>
      </div>
      <InvoiceBuilder clients={clients ?? []} defaultClientId={client_id} appointmentId={appointment_id} />
    </div>
  )
}
