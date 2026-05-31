'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import {
  Lock, Unlock, Save, AlertTriangle, Stethoscope,
  Pill, Syringe, FlaskConical, Plus, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button-link'
import { useRouter } from 'next/navigation'

const schema = z.object({
  chief_complaint: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  weight_at_visit: z.coerce.number().positive().optional().or(z.literal('')),
  temperature: z.coerce.number().optional().or(z.literal('')),
  heart_rate: z.coerce.number().int().positive().optional().or(z.literal('')),
  respiratory_rate: z.coerce.number().int().positive().optional().or(z.literal('')),
  blood_pressure: z.string().optional(),
  pain_score: z.coerce.number().int().min(0).max(10).optional().or(z.literal('')),
  follow_up_required: z.boolean().optional(),
  follow_up_in_days: z.coerce.number().int().positive().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const SOAP_SECTIONS = [
  { key: 'subjective', label: 'S — Subjective', description: 'Patient history, owner concerns, observations', color: 'border-blue-200 bg-blue-50/30' },
  { key: 'objective', label: 'O — Objective', description: 'Physical exam findings, measurements', color: 'border-green-200 bg-green-50/30' },
  { key: 'assessment', label: 'A — Assessment', description: 'Diagnosis, interpretation, differential', color: 'border-orange-200 bg-orange-50/30' },
  { key: 'plan', label: 'P — Plan', description: 'Treatment plan, follow-up, client instructions', color: 'border-purple-200 bg-purple-50/30' },
]

export function SOAPEditor({ record, readOnly }: { record: any; readOnly: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)

  const { register, handleSubmit, formState: { isDirty } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      chief_complaint: record.chief_complaint ?? '',
      subjective: record.subjective ?? '',
      objective: record.objective ?? '',
      assessment: record.assessment ?? '',
      plan: record.plan ?? '',
      weight_at_visit: record.weight_at_visit ?? '',
      temperature: record.temperature ?? '',
      heart_rate: record.heart_rate ?? '',
      respiratory_rate: record.respiratory_rate ?? '',
      blood_pressure: record.blood_pressure ?? '',
      pain_score: record.pain_score ?? '',
      follow_up_required: record.follow_up_required ?? false,
      follow_up_in_days: record.follow_up_in_days ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    const { error } = await supabase.from('medical_records').update({
      chief_complaint: data.chief_complaint || null,
      subjective: data.subjective || null,
      objective: data.objective || null,
      assessment: data.assessment || null,
      plan: data.plan || null,
      weight_at_visit: data.weight_at_visit ? Number(data.weight_at_visit) : null,
      temperature: data.temperature ? Number(data.temperature) : null,
      heart_rate: data.heart_rate ? Number(data.heart_rate) : null,
      respiratory_rate: data.respiratory_rate ? Number(data.respiratory_rate) : null,
      blood_pressure: data.blood_pressure || null,
      pain_score: data.pain_score !== '' ? Number(data.pain_score) : null,
      follow_up_required: data.follow_up_required ?? false,
      follow_up_in_days: data.follow_up_in_days ? Number(data.follow_up_in_days) : null,
    } as never).eq('id', record.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Record saved')
    router.refresh()
  }

  async function handleLock() {
    setLocking(true)
    const { error } = await supabase.from('medical_records').update({
      is_locked: true,
      locked_at: new Date().toISOString(),
    } as never).eq('id', record.id)
    setLocking(false)
    if (error) { toast.error(error.message); return }
    toast.success('Record locked')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Medical Record</h1>
            {readOnly ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                <Lock className="w-3 h-3" />Locked
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                <Unlock className="w-3 h-3" />Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span>{formatDate(record.visit_date)}</span>
            <Link href={`/pets/${record.pets?.id}`} className="text-blue-600 hover:underline">
              {record.pets?.name} ({record.pets?.species})
            </Link>
            {record.profiles && <span>Dr. {record.profiles.first_name} {record.profiles.last_name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <>
              <Button type="submit" variant="outline" disabled={saving || !isDirty}>
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" onClick={handleLock} disabled={locking}>
                <Lock className="w-4 h-4 mr-2" />{locking ? 'Locking...' : 'Lock Record'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main SOAP columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label htmlFor="chief_complaint" className="text-sm font-semibold">Chief Complaint</Label>
            <Input
              id="chief_complaint"
              placeholder="Primary reason for visit..."
              disabled={readOnly}
              {...register('chief_complaint')}
            />
          </div>

          {/* SOAP sections */}
          {SOAP_SECTIONS.map(section => (
            <div key={section.key} className={`rounded-xl border p-4 ${section.color}`}>
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
              <Textarea
                rows={4}
                disabled={readOnly}
                className="bg-white resize-none"
                {...register(section.key as keyof FormData)}
              />
            </div>
          ))}
        </div>

        {/* Right panel — vitals + clinical data */}
        <div className="space-y-5">
          {/* Vitals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <VitalField label="Weight" suffix={record.pets?.weight_unit ?? 'lbs'} disabled={readOnly} {...register('weight_at_visit')} />
              <VitalField label="Temperature" suffix="°F" disabled={readOnly} {...register('temperature')} />
              <VitalField label="Heart Rate" suffix="bpm" disabled={readOnly} {...register('heart_rate')} />
              <VitalField label="Resp. Rate" suffix="/min" disabled={readOnly} {...register('respiratory_rate')} />
              <VitalField label="Blood Pressure" suffix="" disabled={readOnly} {...register('blood_pressure')} />
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Pain Score (0–10)</Label>
                <Input type="number" min={0} max={10} disabled={readOnly} className="h-8 text-sm" {...register('pain_score')} />
              </div>
            </CardContent>
          </Card>

          {/* Diagnoses */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Diagnoses</CardTitle>
                {!readOnly && (
                  <ButtonLink href={`/medical-records/${record.id}/diagnoses/new`} size="sm" variant="ghost" className="h-6 px-2">
                    <Plus className="w-3 h-3" />
                  </ButtonLink>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!record.diagnoses?.length ? (
                <p className="text-xs text-gray-400">No diagnoses added</p>
              ) : (
                <div className="space-y-2">
                  {record.diagnoses.map((d: any) => (
                    <div key={d.id} className="flex items-start gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium flex-shrink-0 mt-0.5">
                        {d.diagnosis_type}
                      </span>
                      <p className="text-sm text-gray-700">{d.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5" />Prescriptions
                </CardTitle>
                {!readOnly && (
                  <ButtonLink href={`/medical-records/${record.id}/prescriptions/new`} size="sm" variant="ghost" className="h-6 px-2">
                    <Plus className="w-3 h-3" />
                  </ButtonLink>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!record.prescriptions?.length ? (
                <p className="text-xs text-gray-400">No prescriptions</p>
              ) : (
                <div className="space-y-2">
                  {record.prescriptions.map((p: any) => (
                    <div key={p.id} className="text-sm">
                      <p className="font-medium text-gray-900">{p.medication_name}</p>
                      <p className="text-xs text-gray-500">{p.dosage} · {p.frequency}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vaccinations */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Syringe className="w-3.5 h-3.5" />Vaccines Given
                </CardTitle>
                {!readOnly && (
                  <ButtonLink href={`/medical-records/${record.id}/vaccinations/new`} size="sm" variant="ghost" className="h-6 px-2">
                    <Plus className="w-3 h-3" />
                  </ButtonLink>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!record.vaccinations?.length ? (
                <p className="text-xs text-gray-400">No vaccines recorded</p>
              ) : (
                <div className="space-y-1.5">
                  {record.vaccinations.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{v.vaccine_name}</span>
                      {v.next_due_date && <span className="text-xs text-gray-400">Due {formatDate(v.next_due_date)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}

function VitalField({ label, suffix, disabled, ...props }: { label: string; suffix: string; disabled: boolean; [key: string]: any }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <Input type="text" disabled={disabled} className="h-7 text-sm flex-1" {...props} />
        {suffix && <span className="text-xs text-gray-400 flex-shrink-0">{suffix}</span>}
      </div>
    </div>
  )
}
