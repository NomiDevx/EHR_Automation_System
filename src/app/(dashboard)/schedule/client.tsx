'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatDateTime, APPOINTMENT_STATUS_COLORS, humanizeLabel, patientFullName } from '@/lib/utils';
import type { Appointment, Patient, Profile } from '@/lib/types/database';
import { Calendar, List, ChevronLeft, ChevronRight, Clock, CalendarClock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { AppointmentUpdateModal } from '@/components/AppointmentUpdateModal';

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

/** Statuses that are still mutable (can be rescheduled / cancelled) */
const MUTABLE_STATUSES = new Set(['scheduled', 'confirmed']);

export function ScheduleClient({ appointments, providers, currentUserId }: ScheduleClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [view, setView] = useState<View>('week');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingAppt, setEditingAppt] = useState<(Appointment & { patient: any; provider: any }) | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filtered = appointments.filter((a) => {
    const matchProvider = providerFilter === 'all' || a.provider_id === providerFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchProvider && matchStatus;
  });

  const apptForDay = (day: Date) =>
    filtered.filter((a) => isSameDay(parseISO(a.scheduled_at), day));

  const handleSuccess = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const openEdit = (appt: Appointment & { patient: any; provider: any }) => {
    setEditingAppt(appt);
  };

  return (
    <div className="space-y-4">
      {/* ── Controls ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 border border-[hsl(var(--border))] rounded-lg p-1 self-start">
          <button
            onClick={() => setView('week')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'week' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            )}
          >
            <Calendar className="w-3.5 h-3.5" /> Week
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'list' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            )}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>

        <select
          value={providerFilter}
          onChange={e => setProviderFilter(e.target.value)}
          className="input max-w-[200px]"
          id="provider-filter"
        >
          <option value="all">All Providers</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input max-w-[180px]"
          id="status-filter"
        >
          <option value="all">All Statuses</option>
          {['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'].map(s => (
            <option key={s} value={s}>{humanizeLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* ── Week View ────────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="card p-0 overflow-hidden">
          {/* Week navigator */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <button
              onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="btn-ghost btn p-1.5"
              id="prev-week-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="btn-ghost btn p-1.5"
              id="next-week-btn"
            >
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
                    {dayAppts.map((a) => {
                      const timeLabel = format(parseISO(a.scheduled_at), 'h:mm a');
                      const ptName = a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—';
                      return (
                        <div key={a.id} className="group/appt relative border border-[hsl(var(--border))]/40 rounded p-1.5 bg-[hsl(var(--surface-hover))]">
                          {/* Main chip — click to patient */}
                          <Link
                            href={`/clinical/patients/${a.patient_id}`}
                            id={`appt-${a.id}`}
                            className={cn(
                              'block rounded p-1 text-[11px] font-semibold leading-tight hover:opacity-80 transition-opacity pr-6',
                              APPOINTMENT_STATUS_COLORS[a.status],
                            )}
                          >
                            <p className="truncate">{ptName}</p>
                            <p className="opacity-80 mt-0.5 text-[9px] font-medium">{timeLabel}</p>
                          </Link>

                          {/* Edit button (only for mutable statuses) — clearly visible option */}
                          {MUTABLE_STATUSES.has(a.status) && (
                            <button
                              onClick={() => openEdit(a)}
                              id={`week-edit-btn-${a.id}`}
                              title="Reschedule or cancel"
                              className="absolute top-1.5 right-1.5 p-1 rounded bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/25 transition-all shadow-sm flex items-center justify-center"
                            >
                              <CalendarClock className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
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

      {/* ── List View ────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="pl-5">Date &amp; Time</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Complaint</th>
                <th className="pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="group/row">
                  <td className="pl-5 text-xs whitespace-nowrap">{formatDateTime(a.scheduled_at)}</td>
                  <td>
                    <Link
                      href={`/clinical/patients/${a.patient_id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
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
                  <td className="text-xs text-[hsl(var(--muted-foreground))] max-w-[160px] truncate">
                    {a.chief_complaint ?? '—'}
                  </td>

                  {/* Actions column */}
                  <td className="pr-4">
                    {MUTABLE_STATUSES.has(a.status) ? (
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        {/* Reschedule button */}
                        <button
                          onClick={() => openEdit(a)}
                          id={`list-reschedule-btn-${a.id}`}
                          title="Reschedule"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[11px] font-semibold hover:bg-[hsl(var(--primary))]/20 transition-colors whitespace-nowrap"
                        >
                          <CalendarClock className="w-3 h-3 shrink-0" />
                          Reschedule
                        </button>

                        {/* Cancel button */}
                        <button
                          onClick={() => openEdit(a)}
                          id={`list-cancel-btn-${a.id}`}
                          title="Cancel"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/8 border border-red-500/20 text-red-400 text-[11px] font-semibold hover:bg-red-500/15 transition-colors"
                        >
                          <XCircle className="w-3 h-3 shrink-0" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))] opacity-40">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                    No appointments in this range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Update Modal ─────────────────────────────────────────── */}
      {editingAppt && (
        <AppointmentUpdateModal
          appointmentId={editingAppt.id}
          currentScheduledAt={editingAppt.scheduled_at}
          appointmentLabel={
            editingAppt.patient
              ? `${editingAppt.patient.first_name} ${editingAppt.patient.last_name}` +
                (editingAppt.provider ? ` · Dr. ${editingAppt.provider.last_name}` : '')
              : 'Appointment'
          }
          onClose={() => setEditingAppt(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
