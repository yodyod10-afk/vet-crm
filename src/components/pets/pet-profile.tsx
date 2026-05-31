'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ButtonLink } from '@/components/ui/button-link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPetAge, formatDate, formatRelative } from '@/lib/utils'
import {
  Calendar, FileText, Syringe, Pill, AlertTriangle,
  Edit, Plus, ChevronRight, Lock, Unlock
} from 'lucide-react'

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐱', rabbit: '🐰', bird: '🐦',
  fish: '🐟', reptile: '🦎', hamster: '🐹', other: '🐾',
}

const SEX_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female',
  male_neutered: 'Male (Neutered)', female_spayed: 'Female (Spayed)', unknown: 'Unknown',
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-yellow-50 text-yellow-700',
  moderate: 'bg-orange-50 text-orange-700',
  severe: 'bg-red-50 text-red-700',
}

export function PetProfile({ pet, vets }: { pet: any; vets: any[] }) {
  const emoji = SPECIES_EMOJI[pet.species?.toLowerCase()] ?? '🐾'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 rounded-2xl">
            <AvatarImage src={pet.avatar_url ?? undefined} className="object-cover" />
            <AvatarFallback className="rounded-2xl bg-amber-50 text-4xl">{emoji}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
              {pet.is_deceased && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Deceased</span>
              )}
            </div>
            <p className="text-gray-600 mt-0.5">
              {pet.breed || pet.species}
              {pet.sex ? ` · ${SEX_LABELS[pet.sex] ?? pet.sex}` : ''}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {pet.date_of_birth && <span>{formatPetAge(pet.date_of_birth)} old · Born {formatDate(pet.date_of_birth)}</span>}
              {pet.weight && <span>{pet.weight} {pet.weight_unit}</span>}
            </div>
            {pet.clients && (
              <Link href={`/clients/${pet.clients.id}`} className="text-sm text-blue-600 hover:underline mt-1 block">
                Owner: {pet.clients.first_name} {pet.clients.last_name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/appointments/new?pet_id=${pet.id}&client_id=${pet.client_id}`} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />Book Appointment
          </ButtonLink>
          <ButtonLink href={`/medical-records/new?pet_id=${pet.id}`}>
            <FileText className="w-4 h-4 mr-2" />New Record
          </ButtonLink>
        </div>
      </div>

      {/* Allergies banner */}
      {pet.pet_allergies?.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Known Allergies</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {pet.pet_allergies.map((a: any) => (
                <span key={a.id} className={`px-2.5 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[a.severity] ?? 'bg-gray-100 text-gray-700'}`}>
                  {a.allergen} {a.severity ? `(${a.severity})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Medical History <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{pet.medical_records?.length ?? 0}</span></TabsTrigger>
          <TabsTrigger value="vaccines">Vaccines <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{pet.vaccinations?.length ?? 0}</span></TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Patient Details</CardTitle></CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <Detail label="Species" value={pet.species} />
                <Detail label="Breed" value={pet.breed} />
                <Detail label="Sex" value={pet.sex ? SEX_LABELS[pet.sex] : null} />
                <Detail label="Date of Birth" value={pet.date_of_birth ? formatDate(pet.date_of_birth) : null} />
                <Detail label="Age" value={pet.date_of_birth ? formatPetAge(pet.date_of_birth) : null} />
                <Detail label="Weight" value={pet.weight ? `${pet.weight} ${pet.weight_unit}` : null} />
                <Detail label="Color / Markings" value={pet.color} />
                <Separator />
                <Detail label="Microchip" value={pet.microchip_number} />
                <Detail label="Insurance" value={pet.insurance_provider} />
                <Detail label="Policy #" value={pet.insurance_policy} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">Primary Veterinarian</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {pet.primary_vet ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                      {pet.primary_vet.first_name[0]}{pet.primary_vet.last_name[0]}
                    </div>
                    <p className="font-medium text-gray-900">Dr. {pet.primary_vet.first_name} {pet.primary_vet.last_name}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No vet assigned</p>
                )}
                {pet.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{pet.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Medical History</h2>
            <ButtonLink href={`/medical-records/new?pet_id=${pet.id}`} size="sm">
              <Plus className="w-4 h-4 mr-2" />New Record
            </ButtonLink>
          </div>
          <div className="space-y-3">
            {pet.medical_records?.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No medical records yet</p>
            )}
            {pet.medical_records?.map((record: any) => (
              <Link key={record.id} href={`/medical-records/${record.id}`}>
                <div className="flex items-center gap-4 p-4 bg-white border rounded-xl hover:border-blue-300 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {record.chief_complaint || 'Medical Visit'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(record.visit_date)}
                      {record.profiles ? ` · Dr. ${record.profiles.first_name} ${record.profiles.last_name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.is_locked
                      ? <Lock className="w-3.5 h-3.5 text-gray-400" />
                      : <Unlock className="w-3.5 h-3.5 text-orange-400" />
                    }
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vaccines" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Vaccination History</h2>
            <ButtonLink href={`/vaccinations/new?pet_id=${pet.id}`} size="sm">
              <Plus className="w-4 h-4 mr-2" />Add Vaccine
            </ButtonLink>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            {!pet.vaccinations?.length ? (
              <div className="py-12 text-center text-gray-400 text-sm">No vaccinations recorded</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Vaccine</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Administered</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Next Due</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pet.vaccinations.map((v: any) => (
                    <tr key={v.id} className={`${v.next_due_date && new Date(v.next_due_date) < new Date() ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{v.vaccine_name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(v.administered_date)}</td>
                      <td className="px-4 py-3">
                        {v.next_due_date ? (
                          <span className={new Date(v.next_due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatDate(v.next_due_date)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {v.profiles ? `Dr. ${v.profiles.last_name}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Current Medications</h2>
          </div>
          <div className="space-y-3">
            {pet.pet_medications?.filter((m: any) => m.is_active).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No active medications</p>
            )}
            {pet.pet_medications?.filter((m: any) => m.is_active).map((med: any) => (
              <div key={med.id} className="flex items-start gap-3 p-4 bg-white border rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{med.medication_name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {[med.dosage, med.frequency, med.route].filter(Boolean).join(' · ')}
                  </p>
                  {med.start_date && <p className="text-xs text-gray-400 mt-1">Since {formatDate(med.start_date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  )
}
