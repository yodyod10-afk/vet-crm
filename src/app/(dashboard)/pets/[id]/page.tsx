import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PetProfile } from '@/components/pets/pet-profile'

export const metadata: Metadata = { title: 'Pet Profile' }

export default async function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pet } = await supabase
    .from('pets')
    .select(`
      *,
      clients(id, first_name, last_name, email, phone_primary),
      primary_vet:profiles!pets_primary_vet_id_fkey(id, first_name, last_name),
      pet_allergies(*),
      pet_medications(*),
      vaccinations(* ,profiles!vaccinations_administered_by_fkey(first_name, last_name)),
      medical_records(
        id, visit_date, chief_complaint, is_locked, created_at,
        profiles!medical_records_veterinarian_id_fkey(first_name, last_name)
      )
    `)
    .eq('id', id)
    .order('visit_date', { referencedTable: 'medical_records', ascending: false })
    .single()

  if (!pet) notFound()

  const { data: vets } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'veterinarian')
    .eq('is_active', true)

  return <PetProfile pet={pet as any} vets={vets ?? []} />
}
