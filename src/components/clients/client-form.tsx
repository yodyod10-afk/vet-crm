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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone_primary: z.string().optional(),
  phone_secondary: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  preferred_contact: z.enum(['email', 'sms', 'phone']).optional(),
  primary_vet_id: z.string().optional(),
  lead_source: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Vet { id: string; first_name: string; last_name: string }

interface ClientFormProps {
  vets: Vet[]
  defaultValues?: Partial<FormData>
  clientId?: string
}

export function ClientForm({ vets, defaultValues, clientId }: ClientFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!clientId

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  async function onSubmit(data: FormData) {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone_primary: data.phone_primary || null,
      phone_secondary: data.phone_secondary || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      preferred_contact: data.preferred_contact || null,
      primary_vet_id: data.primary_vet_id || null,
      lead_source: data.lead_source || null,
      notes: data.notes || null,
    }

    if (isEdit) {
      const { error } = await supabase.from('clients').update(payload as never).eq('id', clientId!)
      if (error) { toast.error(error.message); return }
      toast.success('Client updated')
      router.refresh()
    } else {
      const { data: created, error } = await supabase.from('clients').insert(payload as any).select().single()
      if (error) { toast.error(error.message); return }
      const c = created as any
      toast.success('Client created')
      router.push(`/clients/${c.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" {...register('last_name')} />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>
            <div className="space-y-2">
              <Label>Preferred Contact</Label>
              <Select onValueChange={v => v && setValue('preferred_contact', v as 'email' | 'sms' | 'phone')} defaultValue={defaultValues?.preferred_contact}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_primary">Primary Phone</Label>
              <Input id="phone_primary" type="tel" {...register('phone_primary')} placeholder="(555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_secondary">Secondary Phone</Label>
              <Input id="phone_secondary" type="tel" {...register('phone_secondary')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Street Address</Label>
            <Input id="address_line1" {...register('address_line1')} />
          </div>
          <Input placeholder="Apt, Suite, etc. (optional)" {...register('address_line2')} />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} maxLength={2} placeholder="FL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" {...register('zip')} maxLength={10} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Emergency Contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input id="emergency_contact_name" {...register('emergency_contact_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input id="emergency_contact_phone" type="tel" {...register('emergency_contact_phone')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Practice Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Veterinarian</Label>
              <Select onValueChange={v => setValue('primary_vet_id', v ?? undefined)} defaultValue={(defaultValues?.primary_vet_id ?? undefined) as string | undefined}>
                <SelectTrigger><SelectValue placeholder="Assign vet..." /></SelectTrigger>
                <SelectContent>
                  {vets.map(v => (
                    <SelectItem key={v.id} value={v.id}>Dr. {v.first_name} {v.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select onValueChange={v => setValue('lead_source', v ?? undefined)} defaultValue={(defaultValues?.lead_source ?? '') as string}>
                <SelectTrigger><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                <SelectContent>
                  {['Referral','Website','Google','Facebook','Instagram','Walk-in','Event','Yelp','Other'].map(s => (
                    <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} placeholder="Internal notes about this client..." {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}
