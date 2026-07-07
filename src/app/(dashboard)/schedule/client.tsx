'use client';

import { useState } from 'react';
import { formatDate, formatDateTime, APPOINTMENT_STATUS_COLORS, humanizeLabel, patientFullName } from '@/lib/utils';
import type { Appointment, Patient, Profile } from '@/lib/types/database';
import { Calendar, List, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';

type View = 'week' | 'list';

interface ScheduleClientProps {
  appointments: (Appointment & { patient: any; provider: any })[];
  providers: Partial<Profile>[];
  currentUserId: string;
}

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-emerald-400',
  in_progress: 'bg-amber-400',
  completed: 'bg-slate-500',
  cancelled: 'bg-red-400',
  no_show: 'bg-orange-400',
};

export function ScheduleClient({ appointments, providers, currentUserId }: ScheduleClientProps) {
  const [view, setView] = useState<View>('week');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filtered = appointments.filter((a) => {
    const matchProvider = providerFilter === 'all' || a.provider_id === providerFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchProvider && matchStatus;
  });

  const apptForDay = (day: Date) =>
    filtered.filter((a) => isSameDay(parseISO(a.scheduled_at), day));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 border border-[hsl(var(--border))] rounded-lg p-1 self-start">
          <button onClick={() => setView('week')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all', view === 'week' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]')}>
            <Calendar className="w-3.5 h-3.5" /> Week
          </button>
          <button onClick={() => setView('list')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all', view === 'list' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]')}>
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>

        <select value={providerFilter} onChange={e => setProviderFilter(e.target.value)} className="input max-w-[200px]" id="provider-filter">
          <option value="all">All Providers</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input max-w-[180px]" id="status-filter">
          <option value="all">All Statuses</option>
          {['scheduled','confirmed','in_progress','completed','cancelled','no_show'].map(s => (
            <option key={s} value={s}>{humanizeLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Week view */}
      {view === 'week' && (
        <div className="card p-0 overflow-hidden">
          {/* Week navigator */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="btn-ghost btn p-1.5" id="prev-week-btn">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="btn-ghost btn p-1.5" id="next-week-btn">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7 divide-x divide-[hsl(var(--border))]">
            {days.map((day) => {
              const dayAppts = apptForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className="min-h-[120px]">
                  <div className={cn('px-2 py-2 text-center border-b border-[hsl(var(--border))]', isToday && 'bg-blue-500/10')}>
                    <p className={cn('text-xs font-semibold', isToday ? 'text-blue-400' : 'text-[hsl(var(--muted-foreground))]')}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={cn('text-sm font-bold', isToday ? 'text-blue-300' : 'text-[hsl(var(--foreground))]')}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="p-1 space-y-1">
                    {dayAppts.map((a) => (
                      <Link
                        key={a.id}
                        href={`/clinical/patients/${a.patient_id}`}
                        id={`appt-${a.id}`}
                        className={cn('block rounded p-1 text-xs leading-tight transition-opacity hover:opacity-80', APPOINTMENT_STATUS_COLORS[a.status])}
                      >
                        <p className="font-medium truncate">{a.patient?.last_name}</p>
                        <p className="opacity-70">{format(parseISO(a.scheduled_at), 'h:mm a')}</p>
                      </Link>
                    ))}
                    {dayAppts.length === 0 && (
                      <p className="text-center text-[10px] text-[hsl(var(--muted-foreground))] py-4 opacity-50">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="pl-5">Date & Time</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Complaint</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="pl-5 text-xs whitespace-nowrap">{formatDateTime(a.scheduled_at)}</td>
                  <td>
                    <Link href={`/clinical/patients/${a.patient_id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                      {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}
                    </Link>
                  </td>
                  <td className="text-xs">Dr. {a.provider?.last_name ?? '—'}</td>
                  <td className="text-xs capitalize">{humanizeLabel(a.type)}</td>
                  <td className="text-xs">{a.duration_mins} min</td>
                  <td>
                    <span className={cn('badge text-xs', APPOINTMENT_STATUS_COLORS[a.status])}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[a.status])} />
                      {a.status}
                    </span>
                  </td>
                  <td className="text-xs text-[hsl(var(--muted-foreground))] max-w-[160px] truncate">{a.chief_complaint ?? '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No appointments in this range</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
