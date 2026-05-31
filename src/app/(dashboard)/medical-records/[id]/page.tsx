import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SOAPEditor } from '@/components/medical-records/soap-editor'

export const metadata: Metadata = { title: 'Medical Record' }

export default async function MedicalRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record } = await supabase
    .from('medical_records')
    .select(`
      *,
      pets(id, name, species, breed, client_id, weight, weight_unit),
      profiles!medical_records_veterinarian_id_fkey(first_name, last_name),
      diagnoses(*),
      treatments(*),
      prescriptions(*),
      vaccinations(*)
    `)
    .eq('id', id)
    .single()

  if (!record) notFound()
  const rec = record as any

  return <SOAPEditor record={rec} readOnly={rec.is_locked} />
}
