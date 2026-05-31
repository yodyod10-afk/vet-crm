import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MedicalRecordForm } from '@/components/medical-records/medical-record-form'

export const metadata: Metadata = { title: 'New Medical Record' }

export default async function NewMedicalRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ pet_id?: string; appointment_id?: string }>
}) {
  const { pet_id, appointment_id } = await searchParams
  if (!pet_id) redirect('/pets')

  const supabase = await createClient()

  const { data: petRaw } = await supabase
    .from('pets')
    .select('id, name, species, clients(id, first_name, last_name)')
    .eq('id', pet_id)
    .single()

  const { data: vetsRaw } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'veterinarian')
    .eq('is_active', true)
    .order('last_name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Medical Record</h1>
        {petRaw && (
          <p className="text-gray-500 text-sm mt-1">
            {(petRaw as any).name} · {(petRaw as any).clients?.first_name} {(petRaw as any).clients?.last_name}
          </p>
        )}
      </div>
      <MedicalRecordForm
        pet={petRaw as any}
        vets={vetsRaw as any[] ?? []}
        appointmentId={appointment_id}
      />
    </div>
  )
}
