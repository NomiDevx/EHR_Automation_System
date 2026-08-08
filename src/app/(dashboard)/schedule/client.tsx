'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatDateTime, APPOINTMENT_STATUS_COLORS, humanizeLabel } from '@/lib/utils';
import type { Appointment, Profile } from '@/lib/types/database';
import {
  Calendar as CalendarIcon, List, ChevronLeft, ChevronRight,
  Clock, CalendarClock, XCircle, User, Stethoscope, Filter,
  RotateCcw, ChevronDown, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { AppointmentUpdateModal } from '@/components/AppointmentUpdateModal';
import { Avatar } from '@/components/ui';

type View = 'week' | 'day' | 'list';

interface ScheduleClientProps {
  appointments: (Appointment & { patient: any; provider: any })[];
  providers: Partial<Profile>[];
  currentUserId: string;
}

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-[#0891B2]',
  confirmed: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-500',
  no_show: 'bg-orange-500',
};

const MUTABLE_STATUSES = new Set(['scheduled', 'confirmed']);

export function ScheduleClient({ appointments, providers, currentUserId }: ScheduleClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [view, setView] = useState<View>('week');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedMobileDay, setSelectedMobileDay] = useState<Date>(new Date());
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

  const handleTodayJump = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedMobileDay(today);
  };

  return (
    <div className="space-y-6">
      {/* ── CONTROLS & FILTER BAR ────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left: View Switcher & Today Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setView('week')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                view === 'week'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0B2A55]'
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Week
            </button>

            <button
              type="button"
              onClick={() => setView('day')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                view === 'day'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0B2A55]'
              )}
            >
              <Clock className="w-3.5 h-3.5" /> Day
            </button>

            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                view === 'list'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0B2A55]'
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            type="button"
            onClick={handleTodayJump}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#E2E8F0] text-xs font-bold text-[#0B2A55] transition-all active:scale-95"
          >
            Today
          </button>
        </div>

        {/* Right: Dropdown Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#94A3B8] hidden sm:block" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#0B2A55] focus:outline-none focus:ring-2 focus:ring-[#0891B2] min-w-[160px]"
              id="provider-filter"
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  Dr. {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#0B2A55] focus:outline-none focus:ring-2 focus:ring-[#0891B2] min-w-[140px]"
            id="status-filter"
          >
            <option value="all">All Statuses</option>
            {['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'].map((s) => (
              <option key={s} value={s}>
                {humanizeLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── WEEK VIEW ────────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm space-y-0">
          {/* Week Navigator Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <button
              type="button"
              onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-white text-[#0B2A55] transition-colors shadow-xs"
              id="prev-week-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="font-cambria text-base font-bold text-[#0B2A55]">
                {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-white text-[#0B2A55] transition-colors shadow-xs"
              id="next-week-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Day Selector Tabs (< md screens) */}
          <div className="flex md:hidden overflow-x-auto border-b border-[#E2E8F0] p-2 gap-1.5 scrollbar-none bg-[#F8FAFC]">
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedMobileDay);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedMobileDay(day)}
                  className={cn(
                    'flex-1 min-w-[50px] py-2 px-1 rounded-xl text-center transition-all border',
                    isSelected
                      ? 'bg-[#0B2A55] text-white border-[#0B2A55] shadow-sm'
                      : isToday
                      ? 'bg-[#0891B2]/10 border-[#0891B2] text-[#0891B2]'
                      : 'bg-white border-[#E2E8F0] text-[#475569]'
                  )}
                >
                  <p className="text-[10px] font-bold uppercase leading-none">{format(day, 'EEE')}</p>
                  <p className="text-sm font-extrabold mt-1 leading-none">{format(day, 'd')}</p>
                </button>
              );
            })}
          </div>

          {/* Single Day Agenda for Mobile (< md) */}
          <div className="block md:hidden p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#0891B2] uppercase tracking-wider">
              {format(selectedMobileDay, 'EEEE, MMMM d, yyyy')}
            </h3>

            {apptForDay(selectedMobileDay).length === 0 ? (
              <div className="py-10 text-center text-xs text-[#94A3B8] italic">
                No appointments scheduled for this day
              </div>
            ) : (
              <div className="space-y-2.5">
                {apptForDay(selectedMobileDay).map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0891B2]">
                          {format(parseISO(a.scheduled_at), 'h:mm a')}
                        </span>
                        <span className={cn('badge text-[10px]', APPOINTMENT_STATUS_COLORS[a.status])}>
                          {a.status}
                        </span>
                      </div>

                      <Link
                        href={`/clinical/patients/${a.patient_id}`}
                        className="font-cambria font-bold text-sm text-[#0B2A55] hover:underline block truncate mt-1"
                      >
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}
                      </Link>

                      {a.provider && (
                        <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                          Dr. {a.provider.last_name} · {humanizeLabel(a.type)}
                        </p>
                      )}
                    </div>

                    {MUTABLE_STATUSES.has(a.status) && (
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#0891B2] hover:bg-[#0891B2] hover:text-white transition-all shadow-xs shrink-0"
                        title="Reschedule or Cancel"
                      >
                        <CalendarClock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop 7-Day Grid View (md: and above) */}
          <div className="hidden md:grid grid-cols-7 divide-x divide-[#E2E8F0] min-h-[500px]">
            {days.map((day) => {
              const dayAppts = apptForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className="flex flex-col h-full min-w-0">
                  {/* Day Header */}
                  <div
                    className={cn(
                      'p-3 text-center border-b border-[#E2E8F0] transition-colors',
                      isToday ? 'bg-[#0891B2]/10 border-b-[#0891B2]' : 'bg-[#F8FAFC]'
                    )}
                  >
                    <p className={cn('text-xs font-bold uppercase tracking-wider', isToday ? 'text-[#0891B2]' : 'text-[#64748B]')}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={cn('font-cambria text-lg font-extrabold mt-0.5 leading-none', isToday ? 'text-[#0891B2]' : 'text-[#0B2A55]')}>
                      {format(day, 'd')}
                    </p>
                  </div>

                  {/* Day Appts Container */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                    {dayAppts.map((a) => {
                      const timeLabel = format(parseISO(a.scheduled_at), 'h:mm a');
                      const ptName = a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—';

                      return (
                        <div
                          key={a.id}
                          className="group relative border border-[#E2E8F0] hover:border-[#0891B2] rounded-xl p-2.5 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold text-[#0891B2]">
                              {timeLabel}
                            </span>
                            <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[a.status])} />
                          </div>

                          <Link
                            href={`/clinical/patients/${a.patient_id}`}
                            id={`appt-${a.id}`}
                            className="font-cambria text-xs font-bold text-[#0B2A55] hover:text-[#0891B2] transition-colors line-clamp-1"
                            title={ptName}
                          >
                            {ptName}
                          </Link>

                          {a.provider && (
                            <p className="text-[10px] text-[#64748B] truncate">
                              Dr. {a.provider.last_name}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9] text-[10px]">
                            <span className={cn('badge text-[9px] px-1.5 py-0.5', APPOINTMENT_STATUS_COLORS[a.status])}>
                              {a.status}
                            </span>

                            {MUTABLE_STATUSES.has(a.status) && (
                              <button
                                type="button"
                                onClick={() => openEdit(a)}
                                id={`week-edit-btn-${a.id}`}
                                title="Reschedule or cancel"
                                className="p-1 rounded-md text-[#0891B2] hover:bg-[#0891B2]/10 transition-colors"
                              >
                                <CalendarClock className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {dayAppts.length === 0 && (
                      <div className="h-full flex items-center justify-center py-8 text-[11px] text-[#94A3B8] opacity-50">
                        —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAY VIEW AGENDA ──────────────────────────────────────── */}
      {view === 'day' && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0891B2]" /> Agenda for {format(selectedMobileDay, 'EEEE, MMMM d, yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMobileDay(addDays(selectedMobileDay, -1))}
                className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0B2A55]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedMobileDay(addDays(selectedMobileDay, 1))}
                className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0B2A55]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {apptForDay(selectedMobileDay).length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CalendarIcon className="w-10 h-10 text-[#94A3B8] mx-auto opacity-40" />
              <h3 className="font-cambria text-base font-bold text-[#0B2A55]">No Appointments</h3>
              <p className="text-xs text-[#64748B]">There are no consultations scheduled on this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apptForDay(selectedMobileDay).map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-4 hover:border-[#0891B2] transition-all shadow-xs"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center min-w-[65px] p-2.5 rounded-xl bg-white border border-[#E2E8F0] shrink-0">
                      <p className="text-xs font-bold text-[#0891B2]">
                        {format(parseISO(a.scheduled_at), 'h:mm a')}
                      </p>
                      <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">{a.duration_mins} min</p>
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/clinical/patients/${a.patient_id}`}
                        className="font-cambria text-base font-bold text-[#0B2A55] hover:text-[#0891B2] transition-colors truncate block"
                      >
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}
                      </Link>
                      <p className="text-xs text-[#64748B] mt-0.5 truncate">
                        {humanizeLabel(a.type)} {a.provider ? `· Dr. ${a.provider.last_name}` : ''}
                      </p>
                      {a.chief_complaint && (
                        <p className="text-xs text-[#475569] italic mt-1 truncate">
                          &quot;{a.chief_complaint}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn('badge text-xs px-2.5 py-1', APPOINTMENT_STATUS_COLORS[a.status])}>
                      {a.status}
                    </span>

                    {MUTABLE_STATUSES.has(a.status) && (
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0891B2] hover:bg-[#0891B2] hover:text-white transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        Reschedule
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW TABLE ───────────────────────────────────────── */}
      {view === 'list' && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-3.5 px-4 pl-6">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Provider</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Chief Complaint</th>
                  <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="py-3.5 px-4 pl-6 font-semibold text-[#0B2A55] whitespace-nowrap">
                      {formatDateTime(a.scheduled_at)}
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/clinical/patients/${a.patient_id}`}
                        className="font-cambria font-bold text-sm text-[#0B2A55] hover:text-[#0891B2] transition-colors"
                      >
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-[#475569]">
                      Dr. {a.provider?.last_name ?? '—'}
                    </td>

                    <td className="py-3.5 px-4 text-[#475569] capitalize font-medium">
                      {humanizeLabel(a.type)}
                    </td>

                    <td className="py-3.5 px-4 text-[#475569]">
                      {a.duration_mins} min
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={cn('badge text-xs px-2.5 py-1 inline-flex items-center gap-1.5', APPOINTMENT_STATUS_COLORS[a.status])}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[a.status])} />
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B] max-w-[180px] truncate">
                      {a.chief_complaint ?? '—'}
                    </td>

                    <td className="py-3.5 px-4 pr-6 text-right">
                      {MUTABLE_STATUSES.has(a.status) ? (
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          id={`list-reschedule-btn-${a.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0891B2]/10 text-[#0891B2] hover:bg-[#0891B2] hover:text-white transition-all text-xs font-bold"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          Reschedule
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-xs text-[#94A3B8] italic">
                      No appointments match the current filter selection
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── UPDATE APPOINTMENT MODAL ──────────────────────────────── */}
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
