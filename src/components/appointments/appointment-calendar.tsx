'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addDays, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isSameDay, isToday, parseISO, differenceInMinutes
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react'
import Link from 'next/link'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7am–7pm
const VET_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
]
const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  checked_in: 'bg-yellow-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
  no_show: 'bg-gray-300',
}

type ViewType = 'day' | 'week' | 'month'

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  appointment_type: string
  status: string
  title: string | null
  room: string | null
  pets: { id: string; name: string; species: string } | null
  clients: { id: string; first_name: string; last_name: string } | null
  profiles: { id: string; first_name: string; last_name: string } | null
}

interface Vet { id: string; first_name: string; last_name: string }

interface AppointmentCalendarProps {
  appointments: Appointment[]
  vets: Vet[]
  initialView: ViewType
  initialDate: string
  userRole: string
}

export function AppointmentCalendar({
  appointments, vets, initialView, initialDate, userRole
}: AppointmentCalendarProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewType>(initialView)
  const [currentDate, setCurrentDate] = useState(() => parseISO(initialDate))
  const [selectedVets, setSelectedVets] = useState<Set<string>>(new Set())

  const vetColorMap = new Map(vets.map((v, i) => [v.id, VET_COLORS[i % VET_COLORS.length]]))

  const navigate = (dir: 1 | -1) => {
    if (view === 'day') setCurrentDate(d => addDays(d, dir))
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
  }

  const toggleVet = (vetId: string) => {
    setSelectedVets(prev => {
      const next = new Set(prev)
      if (next.has(vetId)) next.delete(vetId); else next.add(vetId)
      return next
    })
  }

  const filteredAppointments = appointments.filter(a =>
    selectedVets.size === 0 || (a.profiles && selectedVets.has(a.profiles.id))
  )

  const getApptStyle = (appt: Appointment) => {
    const vetId = appt.profiles?.id
    return vetId ? (vetColorMap.get(vetId) ?? VET_COLORS[0]) : VET_COLORS[0]
  }

  const title = view === 'day'
    ? format(currentDate, 'EEEE, MMMM d, yyyy')
    : view === 'week'
    ? `${format(startOfWeek(currentDate), 'MMM d')} – ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
    : format(currentDate, 'MMMM yyyy')

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar filters */}
      <div className="w-48 flex-shrink-0 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Veterinarians</p>
          <div className="space-y-1.5">
            {vets.map((vet, i) => (
              <button
                key={vet.id}
                onClick={() => toggleVet(vet.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedVets.has(vet.id) || selectedVets.size === 0
                    ? 'opacity-100' : 'opacity-40'
                )}
              >
                <span className={cn('w-3 h-3 rounded-full flex-shrink-0', VET_COLORS[i % VET_COLORS.length].split(' ')[0].replace('bg-', 'bg-').replace('-100', '-400'))} />
                <span className="truncate">Dr. {vet.last_name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
            <span className="text-sm font-semibold text-gray-900 ml-1">{title}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['day','week','month'] as ViewType[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Week view */}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={filteredAppointments}
            getApptStyle={getApptStyle}
          />
        )}

        {/* Day view */}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            appointments={filteredAppointments.filter(a => isSameDay(parseISO(a.scheduled_at), currentDate))}
            getApptStyle={getApptStyle}
          />
        )}

        {/* Month view */}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={filteredAppointments}
            onDayClick={setCurrentDate}
          />
        )}
      </div>
    </div>
  )
}

function WeekView({ currentDate, appointments, getApptStyle }: {
  currentDate: Date
  appointments: Appointment[]
  getApptStyle: (a: Appointment) => string
}) {
  const weekStart = startOfWeek(currentDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="w-14" />
        {days.map(day => (
          <div key={day.toISOString()} className={cn(
            'py-2 text-center border-l border-gray-100 text-sm',
            isToday(day) ? 'bg-blue-50' : ''
          )}>
            <p className="text-xs text-gray-500 font-medium">{format(day, 'EEE')}</p>
            <p className={cn(
              'text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto',
              isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-800'
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-50">
            <div className="w-14 py-2 pr-2 text-right text-xs text-gray-400">
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
            {days.map(day => (
              <div key={day.toISOString()} className={cn(
                'h-14 border-l border-gray-100 relative',
                isToday(day) ? 'bg-blue-50/30' : ''
              )}>
                {appointments
                  .filter(a => {
                    const d = parseISO(a.scheduled_at)
                    return isSameDay(d, day) && d.getHours() === hour
                  })
                  .map(appt => (
                    <Link
                      key={appt.id}
                      href={`/appointments/${appt.id}`}
                      className={cn(
                        'absolute left-0.5 right-0.5 top-0.5 rounded border text-xs p-1 overflow-hidden hover:z-10 hover:shadow-md transition-shadow cursor-pointer',
                        getApptStyle(appt)
                      )}
                      style={{ height: `${Math.max(appt.duration_minutes / 60 * 56, 24)}px` }}
                    >
                      <div className="flex items-center gap-1">
                        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[appt.status])} />
                        <span className="font-medium truncate">{appt.pets?.name}</span>
                      </div>
                      <p className="truncate text-xs opacity-80">{appt.clients?.last_name}</p>
                    </Link>
                  ))
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ currentDate, appointments, getApptStyle }: {
  currentDate: Date
  appointments: Appointment[]
  getApptStyle: (a: Appointment) => string
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-4 py-3 border-b bg-gray-50">
        <p className="font-semibold text-gray-900">{format(currentDate, 'EEEE, MMMM d')}</p>
        <p className="text-sm text-gray-500">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {appointments.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No appointments scheduled</div>
        ) : appointments.map(appt => (
          <Link key={appt.id} href={`/appointments/${appt.id}`} className={cn(
            'flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors',
          )}>
            <div className="text-right w-16 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">{format(parseISO(appt.scheduled_at), 'h:mm')}</p>
              <p className="text-xs text-gray-400">{format(parseISO(appt.scheduled_at), 'a')}</p>
            </div>
            <div className={cn('flex-1 rounded-lg border px-3 py-2', getApptStyle(appt))}>
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[appt.status])} />
                <p className="font-medium text-sm">{appt.pets?.name} · {appt.clients?.first_name} {appt.clients?.last_name}</p>
              </div>
              <p className="text-xs mt-0.5 opacity-75">
                {appt.appointment_type.replace('_', ' ')}
                {appt.profiles ? ` · Dr. ${appt.profiles.last_name}` : ''}
                {' · '}{appt.duration_minutes}min
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function MonthView({ currentDate, appointments, onDayClick }: {
  currentDate: Date
  appointments: Appointment[]
  onDayClick: (d: Date) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const calStart = startOfWeek(monthStart)
  const days = Array.from({ length: 42 }, (_, i) => addDays(calStart, i))

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {days.map(day => {
          const dayAppts = appointments.filter(a => isSameDay(parseISO(a.scheduled_at), day))
          const inMonth = day.getMonth() === currentDate.getMonth()
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[80px] border-r border-b border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50',
                !inMonth ? 'bg-gray-50' : '',
                isToday(day) ? 'bg-blue-50/50' : ''
              )}
            >
              <span className={cn(
                'text-xs w-6 h-6 rounded-full flex items-center justify-center mb-1',
                isToday(day) ? 'bg-blue-600 text-white font-bold' : inMonth ? 'text-gray-800' : 'text-gray-400'
              )}>
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 2).map(a => (
                  <Link key={a.id} href={`/appointments/${a.id}`}
                    className="block text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800 truncate hover:bg-blue-200"
                    onClick={e => e.stopPropagation()}
                  >
                    {format(parseISO(a.scheduled_at), 'h:mm')} {a.pets?.name}
                  </Link>
                ))}
                {dayAppts.length > 2 && (
                  <p className="text-xs text-gray-500 px-1">+{dayAppts.length - 2} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
