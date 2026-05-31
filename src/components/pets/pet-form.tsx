'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const SPECIES = ['dog', 'cat', 'rabbit', 'bird', 'fish', 'reptile', 'hamster', 'other']
const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'male_neutered', label: 'Male (Neutered)' },
  { value: 'female_spayed', label: 'Female (Spayed)' },
  { value: 'unknown', label: 'Unknown' },
]

const schema = z.object({
  client_id: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  species: z.string().min(1, 'Required'),
  breed: z.string().optional(),
  sex: z.string().optional(),
  date_of_birth: z.string().optional(),
  weight: z.coerce.number().positive().optional().or(z.literal('')),
  weight_unit: z.enum(['lbs', 'kg']).optional(),
  color: z.string().optional(),
  microchip_number: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_policy: z.string().optional(),
  primary_vet_id: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface PetFormProps {
  clients: { id: string; first_name: string; last_name: string }[]
  vets: { id: string; first_name: string; last_name: string }[]
  defaultClientId?: string
  petId?: string
  defaultValues?: Partial<FormData>
}

export function PetForm({ clients, vets, defaultClientId, petId, defaultValues }: PetFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!petId

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      client_id: defaultClientId ?? defaultValues?.client_id ?? '',
      name: defaultValues?.name ?? '',
      species: defaultValues?.species ?? '',
      breed: defaultValues?.breed ?? '',
      sex: defaultValues?.sex ?? '',
      date_of_birth: defaultValues?.date_of_birth ?? '',
      weight: defaultValues?.weight ?? '',
      weight_unit: defaultValues?.weight_unit ?? 'lbs',
      color: defaultValues?.color ?? '',
      microchip_number: defaultValues?.microchip_number ?? '',
      insurance_provider: defaultValues?.insurance_provider ?? '',
      insurance_policy: defaultValues?.insurance_policy ?? '',
      primary_vet_id: defaultValues?.primary_vet_id ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    const payload = {
      client_id: data.client_id,
      name: data.name,
      species: data.species,
      breed: data.breed || null,
      sex: data.sex || null,
      date_of_birth: data.date_of_birth || null,
      weight: data.weight ? Number(data.weight) : null,
      weight_unit: data.weight_unit || 'lbs',
      color: data.color || null,
      microchip_number: data.microchip_number || null,
      insurance_provider: data.insurance_provider || null,
      insurance_policy: data.insurance_policy || null,
      primary_vet_id: data.primary_vet_id || null,
      notes: data.notes || null,
    }

    if (isEdit) {
      const { error } = await supabase.from('pets').update(payload as never).eq('id', petId!)
      if (error) { toast.error(error.message); return }
      toast.success('Pet updated')
      router.refresh()
    } else {
      const { data: created, error } = await supabase.from('pets').insert(payload as any).select().single()
      if (error) { toast.error(error.message); return }
      toast.success('Pet added')
      router.push(`/pets/${(created as any).id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Patient Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Owner *</Label>
            <Select
              defaultValue={defaultClientId ?? defaultValues?.client_id ?? ''}
              onValueChange={v => setValue('client_id', v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p className="text-xs text-red-500">{errors.client_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input id="name" placeholder="e.g. Buddy" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Species *</Label>
              <Select
                defaultValue={defaultValues?.species ?? ''}
                onValueChange={v => setValue('species', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species..." />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.species && <p className="text-xs text-red-500">{errors.species.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" placeholder="e.g. Golden Retriever" {...register('breed')} />
            </div>
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select
                defaultValue={defaultValues?.sex ?? ''}
                onValueChange={v => setValue('sex', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {SEX_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color / Markings</Label>
              <Input id="color" placeholder="e.g. Brown and white" {...register('color')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" type="number" step={0.1} min={0} placeholder="0.0" {...register('weight')} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                defaultValue={defaultValues?.weight_unit ?? 'lbs'}
                onValueChange={v => setValue('weight_unit', (v ?? 'lbs') as 'lbs' | 'kg')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Medical & Insurance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Veterinarian</Label>
            <Select
              defaultValue={defaultValues?.primary_vet_id ?? ''}
              onValueChange={v => setValue('primary_vet_id', v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign vet..." />
              </SelectTrigger>
              <SelectContent>
                {vets.map(v => (
                  <SelectItem key={v.id} value={v.id}>Dr. {v.first_name} {v.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="microchip_number">Microchip #</Label>
              <Input id="microchip_number" {...register('microchip_number')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurance_provider">Insurance Provider</Label>
              <Input id="insurance_provider" {...register('insurance_provider')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance_policy">Policy #</Label>
              <Input id="insurance_policy" {...register('insurance_policy')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} placeholder="Behavioral notes, special handling instructions..." {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            : isEdit ? 'Save Changes' : 'Add Pet'}
        </Button>
      </div>
    </form>
  )
}
