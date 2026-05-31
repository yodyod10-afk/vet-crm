'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatDateTime, formatDate } from '@/lib/utils'
import {
  Calendar, Clock, MapPin, User, PawPrint,
  Stethoscope, Edit, FileText, X, CheckCircle2,
  AlertCircle, RotateCcw
} from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700' },
  confirmed: { label: 'Confirmed', color: 'bg-green-50 text-green-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-50 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
  no_show: { label: 'No Show', color: 'bg-yellow-50 text-yellow-700' },
}

const TYPE_LABELS: Record<string, string> = {
  wellness: 'Wellness / Annual Exam',
  sick_visit: 'Sick Visit',
  follow_up: 'Follow-up',
  vaccination: 'Vaccination',
  dental: 'Dental',
  surgery: 'Surgery',
  grooming: 'Grooming',
  emergency: 'Emergency',
  other: 'Other',
}

const NEXT_STATUSES: Record<string, { value: string; label: string; icon: React.ElementType }[]> = {
  scheduled: [
    { value: 'confirmed', label: 'Confirm', icon: CheckCircle2 },
    { value: 'cancelled', label: 'Cancel', icon: X },
    { value: 'no_show', label: 'No Show', icon: AlertCircle },
  ],
  confirmed: [
    { value: 'in_progress', label: 'Check In', icon: CheckCircle2 },
    { value: 'cancelled', label: 'Cancel', icon: X },
    { value: 'no_show', label: 'No Show', icon: AlertCircle },
  ],
  in_progress: [
    { value: 'completed', label: 'Complete', icon: CheckCircle2 },
  ],
  cancelled: [
    { value: 'scheduled', label: 'Reschedule', icon: RotateCcw },
  ],
  no_show: [
    { value: 'scheduled', label: 'Reschedule', icon: RotateCcw },
  ],
  completed: [],
}

export function AppointmentDetail({ appointment, vets }: { appointment: any; vets: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState(appointment.status)
  const [updating, setUpdating] = useState(false)

  const statusCfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
  const actions = NEXT_STATUSES[status] ?? []

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus } as never)
      .eq('id', appointment.id)
    setUpdating(false)
    if (error) { toast.error(error.message); return }
    setStatus(newStatus)
    toast.success(`Appointment ${newStatus.replace('_', ' ')}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {appointment.title || TYPE_LABELS[appointment.appointment_type] || 'Appointment'}
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {formatDateTime(appointment.scheduled_at)} · {appointment.duration_minutes} min
          </p>
        </div>
        <div className="flex gap-2">
          {actions.map(action => {
            const Icon = action.icon
            return (
              <Button
                key={action.value}
                variant={action.value === 'completed' || action.value === 'confirmed' || action.value === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStatus(action.value)}
                disabled={updating}
              >
                <Icon className="w-4 h-4 mr-1.5" />{action.label}
              </Button>
            )
          })}
          <ButtonLink href={`/appointments/${appointment.id}/edit`} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1.5" />Edit
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Appointment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Calendar} label="Date & Time" value={formatDateTime(appointment.scheduled_at)} />
                <InfoItem icon={Clock} label="Duration" value={`${appointment.duration_minutes} minutes`} />
                <InfoItem icon={Calendar} label="Type" value={TYPE_LABELS[appointment.appointment_type] ?? appointment.appointment_type} />
                {appointment.room && <InfoItem icon={MapPin} label="Room" value={appointment.room} />}
              </div>
              {appointment.reason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Reason for Visit</p>
                    <p className="text-gray-800">{appointment.reason}</p>
                  </div>
                </>
              )}
              {appointment.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Internal Notes</p>
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Medical record link */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Medical Record</CardTitle>
                {status === 'completed' || status === 'in_progress' ? (
                  <ButtonLink
                    href={`/medical-records/new?appointment_id=${appointment.id}&pet_id=${appointment.pets?.id}`}
                    size="sm"
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-1.5" />New Record
                  </ButtonLink>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                {status === 'scheduled' || status === 'confirmed'
                  ? 'Medical record will be available once the appointment begins.'
                  : 'No medical record linked to this appointment.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Pet */}
          {appointment.pets && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Patient</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/pets/${appointment.pets.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
                    <PawPrint className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.pets.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{appointment.pets.species}{appointment.pets.breed ? ` · ${appointment.pets.breed}` : ''}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Client */}
          {appointment.clients && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Owner</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link href={`/clients/${appointment.clients.id}`} className="font-medium text-blue-600 hover:underline">
                  {appointment.clients.first_name} {appointment.clients.last_name}
                </Link>
                {appointment.clients.phone_primary && (
                  <p className="text-gray-500">{appointment.clients.phone_primary}</p>
                )}
                {appointment.clients.email && (
                  <p className="text-gray-500">{appointment.clients.email}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vet */}
          {appointment.profiles && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Veterinarian</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                    {appointment.profiles.first_name[0]}{appointment.profiles.last_name[0]}
                  </div>
                  <p className="font-medium text-gray-900 text-sm">
                    Dr. {appointment.profiles.first_name} {appointment.profiles.last_name}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  )
}
