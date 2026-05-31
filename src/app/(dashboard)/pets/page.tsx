import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui/button-link'
import { formatPetAge, formatDate } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pets' }

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐱', rabbit: '🐰', bird: '🐦',
  fish: '🐟', reptile: '🦎', hamster: '🐹', other: '🐾',
}

export default async function PetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; species?: string }>
}) {
  const { q, species } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('pets')
    .select('id, name, species, breed, date_of_birth, weight, weight_unit, is_deceased, clients(id, first_name, last_name)')
    .order('name')
    .limit(200)

  if (q) query = query.ilike('name', `%${q}%`)
  if (species) query = query.eq('species', species)

  const { data: petsRaw } = await query
  const pets = petsRaw as any[] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
          <p className="text-gray-500 text-sm mt-1">{pets.length} patients registered</p>
        </div>
        <ButtonLink href="/pets/new"><Plus className="w-4 h-4 mr-2" />Add Pet</ButtonLink>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pets.length === 0 ? (
          <div className="col-span-4 py-16 text-center text-gray-400 text-sm">
            No pets found
          </div>
        ) : pets.map(pet => {
          const emoji = SPECIES_EMOJI[pet.species?.toLowerCase()] ?? '🐾'
          return (
            <Link key={pet.id} href={`/pets/${pet.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{pet.name}</p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {pet.breed || pet.species}
                      {pet.is_deceased && ' · Deceased'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {pet.date_of_birth && (
                    <p>{formatPetAge(pet.date_of_birth)} old</p>
                  )}
                  {pet.weight && (
                    <p>{pet.weight} {pet.weight_unit}</p>
                  )}
                  {pet.clients && (
                    <p className="text-blue-600 truncate">
                      {pet.clients.first_name} {pet.clients.last_name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
