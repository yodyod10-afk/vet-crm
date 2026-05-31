import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-green-50 text-green-700',
  checked_in: 'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-orange-50 text-orange-700',
  completed: 'bg-gray-50 text-gray-600',
}

const TYPE_LABELS: Record<string, string> = {
  wellness: 'Wellness',
  sick_visit: 'Sick Visit',
  surgery: 'Surgery',
  dental: 'Dental',
  follow_up: 'Follow-up',
  vaccine: 'Vaccine',
  emergency: 'Emergency',
  other: 'Other',
}

interface Appointment {
  id: string
  scheduled_at: string
  appointment_type: string
  status: string
  pets: { name: string; species: string } | null
  clients: { first_name: string; last_name: string } | null
  profiles: { first_name: string; last_name: string } | null
}

export function AppointmentsToday({ appointments }: { appointments: Appointment[] }) {
  if (!appointments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-gray-400">No appointments today</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto">
      {appointments.map(appt => (
        <Link
          key={appt.id}
          href={`/appointments/${appt.id}`}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="text-right min-w-[3.5rem]">
            <p className="text-xs font-semibold text-gray-900">
              {format(new Date(appt.scheduled_at), 'h:mm')}
            </p>
            <p className="text-xs text-gray-400">
              {format(new Date(appt.scheduled_at), 'a')}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {appt.pets?.name ?? '—'} · {appt.clients ? `${appt.clients.first_name} ${appt.clients.last_name}` : ''}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
              {appt.profiles ? ` · Dr. ${appt.profiles.last_name}` : ''}
            </p>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', STATUS_STYLES[appt.status] ?? 'bg-gray-50 text-gray-600')}>
            {appt.status.replace('_', ' ')}
          </span>
        </Link>
      ))}
    </div>
  )
}
