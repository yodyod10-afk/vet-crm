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
import { format } from 'date-fns'

const schema = z.object({
  visit_date: z.string().min(1, 'Required'),
  veterinarian_id: z.string().min(1, 'Required'),
  chief_complaint: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface MedicalRecordFormProps {
  pet: any
  vets: { id: string; first_name: string; last_name: string }[]
  appointmentId?: string
}

export function MedicalRecordForm({ pet, vets, appointmentId }: MedicalRecordFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      veterinarian_id: '',
      chief_complaint: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    },
  })

  async function onSubmit(data: FormData) {
    const { data: created, error } = await supabase
      .from('medical_records')
      .insert({
        pet_id: pet.id,
        client_id: pet.clients?.id,
        appointment_id: appointmentId || null,
        veterinarian_id: data.veterinarian_id,
        visit_date: data.visit_date,
        chief_complaint: data.chief_complaint || null,
        subjective: data.subjective || null,
        objective: data.objective || null,
        assessment: data.assessment || null,
        plan: data.plan || null,
        is_locked: false,
      } as any)
      .select()
      .single()

    if (error) { toast.error(error.message); return }
    toast.success('Medical record created')
    router.push(`/medical-records/${(created as any).id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Visit Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date">Visit Date *</Label>
              <Input id="visit_date" type="date" {...register('visit_date')} />
              {errors.visit_date && <p className="text-xs text-red-500">{errors.visit_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Veterinarian *</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="chief_complaint">Chief Complaint</Label>
            <Input id="chief_complaint" placeholder="Primary reason for visit..." {...register('chief_complaint')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">SOAP Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'subjective', label: 'S — Subjective', placeholder: 'History, owner concerns, observations...' },
            { key: 'objective', label: 'O — Objective', placeholder: 'Physical exam findings, measurements...' },
            { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis, differential...' },
            { key: 'plan', label: 'P — Plan', placeholder: 'Treatment, follow-up, instructions...' },
          ].map(section => (
            <div key={section.key} className="space-y-2">
              <Label className="text-sm font-semibold">{section.label}</Label>
              <Textarea rows={3} placeholder={section.placeholder} {...register(section.key as keyof FormData)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Record'}
        </Button>
      </div>
    </form>
  )
}
