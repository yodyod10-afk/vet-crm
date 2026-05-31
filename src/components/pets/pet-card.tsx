import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatPetAge } from '@/lib/utils'
import { Heart } from 'lucide-react'

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐱', rabbit: '🐰', bird: '🐦',
  fish: '🐟', reptile: '🦎', hamster: '🐹', other: '🐾',
}

const SEX_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female',
  male_neutered: 'Male (N)', female_spayed: 'Female (S)', unknown: 'Unknown',
}

interface PetCardProps {
  pet: {
    id: string
    name: string
    species: string
    breed: string | null
    sex: string | null
    date_of_birth: string | null
    weight: number | null
    weight_unit: string
    is_deceased: boolean
    avatar_url: string | null
  }
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <Link href={`/pets/${pet.id}`} className="block">
      <div className={`bg-white border rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all ${pet.is_deceased ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 rounded-xl">
            <AvatarImage src={pet.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-xl bg-amber-50 text-xl">
              {SPECIES_EMOJI[pet.species.toLowerCase()] ?? '🐾'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
              {pet.is_deceased && (
                <span className="text-xs text-gray-400">Deceased</span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {pet.breed || pet.species}
              {pet.sex ? ` · ${SEX_LABELS[pet.sex]}` : ''}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          {pet.date_of_birth && <span>{formatPetAge(pet.date_of_birth)}</span>}
          {pet.weight && <span>{pet.weight} {pet.weight_unit}</span>}
        </div>
      </div>
    </Link>
  )
}
