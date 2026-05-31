import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { VaccinationForm } from '@/components/vaccinations/vaccination-form'

export const metadata: Metadata = { title: 'Record Vaccination' }

export default async function NewVaccinationPage({
  searchParams,
}: {
  searchParams: Promise<{ pet_id?: string; record_id?: string }>
}) {
  const { pet_id, record_id } = await searchParams
  const supabase = await createClient()

  const [{ data: petsRaw }, { data: vetsRaw }] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, species, clients(id, first_name, last_name)')
      .order('name'),
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'veterinarian')
      .eq('is_active', true)
      .order('last_name'),
  ])

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Record Vaccination</h1>
        <p className="text-gray-500 text-sm mt-1">Log a vaccine administered to a patient</p>
      </div>
      <VaccinationForm
        pets={petsRaw as any[] ?? []}
        vets={vetsRaw as any[] ?? []}
        defaultPetId={pet_id}
        medicalRecordId={record_id}
      />
    </div>
  )
}
