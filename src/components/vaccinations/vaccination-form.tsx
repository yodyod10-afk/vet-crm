'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { format, addYears } from 'date-fns'

const COMMON_VACCINES = [
  'Rabies (1yr)', 'Rabies (3yr)', 'DHPP', 'Bordetella', 'Leptospirosis',
  'Lyme', 'Influenza', 'FVRCP', 'FeLV', 'Distemper', 'Other',
]

const schema = z.object({
  pet_id: z.string().min(1, 'Select a patient'),
  veterinarian_id: z.string().min(1, 'Select a veterinarian'),
  vaccine_name: z.string().min(1, 'Required'),
  administered_date: z.string().min(1, 'Required'),
  next_due_date: z.string().optional(),
  lot_number: z.string().optional(),
  manufacturer: z.string().optional(),
  site: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Pet { id: string; name: string; species: string; clients: any }

interface VaccinationFormProps {
  pets: Pet[]
  vets: { id: string; first_name: string; last_name: string }[]
  defaultPetId?: string
  medicalRecordId?: string
}

export function VaccinationForm({ pets, vets, defaultPetId, medicalRecordId }: VaccinationFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      pet_id: defaultPetId ?? '',
      veterinarian_id: '',
      vaccine_name: '',
      administered_date: format(new Date(), 'yyyy-MM-dd'),
      next_due_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
      lot_number: '',
      manufacturer: '',
      site: '',
    },
  })

  const selectedPetId = watch('pet_id')
  const selectedPet = pets.find(p => p.id === selectedPetId)

  async function onSubmit(data: FormData) {
    const { error } = await supabase.from('vaccinations').insert({
      pet_id: data.pet_id,
      client_id: selectedPet?.clients?.id ?? null,
      veterinarian_id: data.veterinarian_id,
      medical_record_id: medicalRecordId || null,
      vaccine_name: data.vaccine_name,
      administered_date: data.administered_date,
      next_due_date: data.next_due_date || null,
      lot_number: data.lot_number || null,
      manufacturer: data.manufacturer || null,
      site: data.site || null,
    } as any)

    if (error) { toast.error(error.message); return }
    toast.success('Vaccination recorded')

    if (medicalRecordId) {
      router.push(`/medical-records/${medicalRecordId}`)
    } else if (selectedPetId) {
      router.push(`/pets/${selectedPetId}`)
    } else {
      router.push('/vaccinations')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Patient & Provider</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Select
              defaultValue={defaultPetId ?? ''}
              onValueChange={v => setValue('pet_id', v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent>
                {pets.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.clients?.first_name} {p.clients?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pet_id && <p className="text-xs text-red-500">{errors.pet_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Administered By *</Label>
            <Select onValueChange={(v: string | null) => setValue('veterinarian_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select vet..." />
              </SelectTrigger>
              <SelectContent>
                {vets.map(v => (
                  <SelectItem key={v.id} value={v.id}>Dr. {v.first_name} {v.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.veterinarian_id && <p className="text-xs text-red-500">{errors.veterinarian_id.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vaccine Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vaccine *</Label>
            <Select onValueChange={(v: string | null) => setValue('vaccine_name', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select vaccine..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_VACCINES.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vaccine_name && <p className="text-xs text-red-500">{errors.vaccine_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="administered_date">Date Administered *</Label>
              <Input id="administered_date" type="date" {...register('administered_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_due_date">Next Due Date</Label>
              <Input id="next_due_date" type="date" {...register('next_due_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lot_number">Lot Number</Label>
              <Input id="lot_number" {...register('lot_number')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" {...register('manufacturer')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site">Administration Site</Label>
            <Input id="site" placeholder="e.g. Right hind limb, Intranasal..." {...register('site')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Record Vaccination'}
        </Button>
      </div>
    </form>
  )
}
