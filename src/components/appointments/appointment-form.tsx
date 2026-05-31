'use client'

import { useState } from 'react'
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

const APPOINTMENT_TYPES = [
  { value: 'wellness', label: 'Wellness / Annual Exam' },
  { value: 'sick_visit', label: 'Sick Visit' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'dental', label: 'Dental' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
]

const DURATIONS = [15, 20, 30, 45, 60, 90, 120]

const ROOMS = ['Exam Room 1', 'Exam Room 2', 'Exam Room 3', 'Surgery Suite', 'Dental Suite', 'Grooming']

const schema = z.object({
  client_id: z.string().min(1, 'Select a client'),
  pet_id: z.string().min(1, 'Select a pet'),
  veterinarian_id: z.string().min(1, 'Select a veterinarian'),
  appointment_type: z.string().min(1, 'Select a type'),
  scheduled_date: z.string().min(1, 'Required'),
  scheduled_time: z.string().min(1, 'Required'),
  duration_minutes: z.coerce.number().int().positive(),
  title: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  room: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Vet { id: string; first_name: string; last_name: string }
interface Pet { id: string; name: string; species: string }
interface ClientWithPets {
  id: string
  first_name: string
  last_name: string
  pets: Pet[]
}

interface AppointmentFormProps {
  vets: Vet[]
  clients: ClientWithPets[]
  defaultClientId?: string
  defaultPetId?: string
  appointmentId?: string
  defaultValues?: Partial<FormData>
}

export function AppointmentForm({
  vets, clients, defaultClientId, defaultPetId, appointmentId, defaultValues,
}: AppointmentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!appointmentId

  const now = new Date()
  const defaultDate = format(now, 'yyyy-MM-dd')
  const defaultTime = format(new Date(Math.ceil(now.getTime() / (15 * 60000)) * (15 * 60000)), 'HH:mm')

  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ?? defaultValues?.client_id ?? '')
  const selectedClient = clients.find(c => c.id === selectedClientId)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      client_id: defaultClientId ?? defaultValues?.client_id ?? '',
      pet_id: defaultPetId ?? defaultValues?.pet_id ?? '',
      veterinarian_id: defaultValues?.veterinarian_id ?? '',
      appointment_type: defaultValues?.appointment_type ?? 'wellness',
      scheduled_date: defaultValues?.scheduled_date ?? defaultDate,
      scheduled_time: defaultValues?.scheduled_time ?? defaultTime,
      duration_minutes: defaultValues?.duration_minutes ?? 30,
      title: defaultValues?.title ?? '',
      reason: defaultValues?.reason ?? '',
      notes: defaultValues?.notes ?? '',
      room: defaultValues?.room ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    const scheduledAt = new Date(`${data.scheduled_date}T${data.scheduled_time}:00`).toISOString()
    const payload = {
      client_id: data.client_id,
      pet_id: data.pet_id,
      veterinarian_id: data.veterinarian_id,
      appointment_type: data.appointment_type,
      scheduled_at: scheduledAt,
      duration_minutes: data.duration_minutes,
      title: data.title || null,
      reason: data.reason || null,
      notes: data.notes || null,
      room: data.room || null,
      status: 'scheduled',
    }

    if (isEdit) {
      const { error } = await supabase.from('appointments').update(payload as never).eq('id', appointmentId!)
      if (error) { toast.error(error.message); return }
      toast.success('Appointment updated')
      router.refresh()
    } else {
      const { data: created, error } = await supabase.from('appointments').insert(payload as any).select().single()
      if (error) { toast.error(error.message); return }
      toast.success('Appointment scheduled')
      router.push(`/appointments/${(created as any).id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Patient & Provider</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select
              defaultValue={defaultClientId ?? defaultValues?.client_id ?? ''}
              onValueChange={v => {
                const val = v ?? ''
                setSelectedClientId(val)
                setValue('client_id', val)
                setValue('pet_id', '')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client..." />
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

          <div className="space-y-2">
            <Label>Pet *</Label>
            <Select
              defaultValue={defaultPetId ?? defaultValues?.pet_id ?? ''}
              onValueChange={v => setValue('pet_id', v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedClient ? 'Select pet...' : 'Select client first'} />
              </SelectTrigger>
              <SelectContent>
                {selectedClient?.pets?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pet_id && <p className="text-xs text-red-500">{errors.pet_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Veterinarian *</Label>
            <Select
              defaultValue={defaultValues?.veterinarian_id ?? ''}
              onValueChange={v => setValue('veterinarian_id', v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign vet..." />
              </SelectTrigger>
              <SelectContent>
                {vets.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    Dr. {v.first_name} {v.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.veterinarian_id && <p className="text-xs text-red-500">{errors.veterinarian_id.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
              {errors.scheduled_date && <p className="text-xs text-red-500">{errors.scheduled_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time *</Label>
              <Input id="scheduled_time" type="time" step={900} {...register('scheduled_time')} />
              {errors.scheduled_time && <p className="text-xs text-red-500">{errors.scheduled_time.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                defaultValue={String(defaultValues?.duration_minutes ?? 30)}
                onValueChange={v => setValue('duration_minutes', Number(v ?? 30))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => (
                    <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                defaultValue={defaultValues?.room ?? ''}
                onValueChange={v => setValue('room', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Visit Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Appointment Type *</Label>
              <Select
                defaultValue={defaultValues?.appointment_type ?? 'wellness'}
                onValueChange={v => setValue('appointment_type', v ?? 'wellness')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.appointment_type && <p className="text-xs text-red-500">{errors.appointment_type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title / Reason (short)</Label>
              <Input id="title" placeholder="e.g. Annual vaccines, Post-op check..." {...register('title')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea id="reason" rows={2} placeholder="Owner's description of the issue or reason..." {...register('reason')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" rows={2} placeholder="Staff notes, reminders..." {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            : isEdit ? 'Save Changes' : 'Schedule Appointment'}
        </Button>
      </div>
    </form>
  )
}
