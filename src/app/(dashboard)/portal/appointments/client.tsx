'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, APPOINTMENT_STATUS_COLORS, humanizeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AppointmentUpdateModal } from '@/components/AppointmentUpdateModal';
import type { AppointmentStatus, Profile } from '@/lib/types/database';
import {
  CalendarClock, XCircle, Clock, Calendar,
  CalendarPlus, ChevronDown, ChevronUp,
} from 'lucide-react';

// Inline mini booking form using bookPublicAppointment
import { bookPublicAppointment } from '@/app/actions';

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_mins: number;
  status: AppointmentStatus;
  type: string;
  chief_complaint: string | null;
  provider: { first_name: string; last_name: string; specialty: string | null } | null;
}

interface PortalAppointmentsClientProps {
  upcoming: Appointment[];
  past: Appointment[];
  doctors: Profile[];
  profile: Profile;
}

const APPT_TYPE_OPTIONS = [
  { value: 'follow_up',   label: 'Follow-up Visit' },
  { value: 'new_patient', label: 'New Patient Visit' },
  { value: 'wellness',    label: 'Wellness Exam' },
  { value: 'telehealth',  label: 'Telehealth Consult' },
  { value: 'urgent',      label: 'Urgent Care' },
];

const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' },  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' }, { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' }, { value: '11:30', label: '11:30 AM' },
  { value: '13:00', label: '1:00 PM' },  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
];

/** Minimum bookable date = tomorrow */
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function PortalAppointmentsClient({
  upcoming, past, doctors, profile,
}: PortalAppointmentsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // ── Appointment update modal ──────────────────────────────────────
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // ── Book new appointment panel ────────────────────────────────────
  const [showBooking, setShowBooking] = useState(false);
  const [bookForm, setBookForm] = useState({
    providerId: '',
    appointmentType: 'follow_up',
    date: '',
    time: '09:00',
    chiefComplaint: '',
    phone: profile.phone ?? '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say' as const,
  });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setBookForm(f => ({ ...f, [k]: e.target.value }));

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    setBookError(null);
    setBookSuccess(null);
    try {
      if (!bookForm.providerId) { setBookError('Please select a doctor.'); return; }
      if (!bookForm.date)       { setBookError('Please select a date.'); return; }
      if (!bookForm.dateOfBirth){ setBookError('Please enter your date of birth.'); return; }

      const scheduledAt = new Date(`${bookForm.date}T${bookForm.time}:00`).toISOString();

      const result = await bookPublicAppointment({
        firstName: profile.first_name,
        lastName:  profile.last_name,
        email:     profile.email,
        phone:     bookForm.phone || profile.phone || '',
        dateOfBirth: bookForm.dateOfBirth,
        gender:    bookForm.gender,
        providerId: bookForm.providerId,
        appointmentType: bookForm.appointmentType as any,
        scheduledAt,
        chiefComplaint: bookForm.chiefComplaint || undefined,
      });

      if ('error' in result) {
        setBookError(String(result.error));
        return;
      }

      const doc = doctors.find(d => d.id === bookForm.providerId);
      const timeLabel = TIME_SLOTS.find(t => t.value === bookForm.time)?.label ?? bookForm.time;
      setBookSuccess(`Appointment booked with Dr. ${doc?.last_name ?? ''} on ${bookForm.date} at ${timeLabel}.`);

      // Reset form
      setBookForm(f => ({ ...f, providerId: '', date: '', chiefComplaint: '' }));

      // Refresh server data
      setTimeout(() => {
        setShowBooking(false);
        setBookSuccess(null);
        startTransition(() => router.refresh());
      }, 2200);
    } catch (err: any) {
      setBookError(err.message || 'An unexpected error occurred.');
    } finally {
      setBooking(false);
    }
  };

  const handleSuccess = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  return (
    <div className="space-y-6">

      {/* ── Book New Appointment Banner ─────────────────────────── */}
      <div className="card border border-[hsl(var(--border))] overflow-hidden">
        {/* Toggle header */}
        <button
          id="toggle-book-new-btn"
          onClick={() => { setShowBooking(v => !v); setBookError(null); setBookSuccess(null); }}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[hsl(var(--surface-hover))] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))]">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Book New Appointment</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Schedule a follow-up, wellness check, or specialist visit</p>
            </div>
          </div>
          {showBooking
            ? <ChevronUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            : <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />}
        </button>

        {/* Collapsible booking form */}
        {showBooking && (
          <form
            onSubmit={handleBook}
            className="border-t border-[hsl(var(--border-muted))] px-5 py-5 space-y-4 animate-fade-in"
          >
            {/* Row 1: Doctor + Visit Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Doctor <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={bookForm.providerId}
                  onChange={setF('providerId')}
                  className="input text-xs"
                  id="book-doctor"
                >
                  <option value="">Choose a physician…</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.first_name} {d.last_name}{d.specialty ? ` · ${d.specialty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">Visit Type</label>
                <select value={bookForm.appointmentType} onChange={setF('appointmentType')} className="input text-xs" id="book-type">
                  {APPT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Preferred Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={minDate()}
                  value={bookForm.date}
                  onChange={setF('date')}
                  className="input text-xs"
                  id="book-date"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">Time Slot</label>
                <select value={bookForm.time} onChange={setF('time')} className="input text-xs" id="book-time">
                  {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: DOB + Phone (needed for patient lookup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={bookForm.dateOfBirth}
                  onChange={setF('dateOfBirth')}
                  className="input text-xs"
                  id="book-dob"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">Phone Number</label>
                <input
                  type="tel"
                  value={bookForm.phone}
                  onChange={setF('phone')}
                  placeholder="555-123-4567"
                  className="input text-xs"
                  id="book-phone"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                Reason for Visit <span className="text-[hsl(var(--muted-foreground))] font-normal">(optional)</span>
              </label>
              <textarea
                value={bookForm.chiefComplaint}
                onChange={setF('chiefComplaint')}
                placeholder="Briefly describe your symptoms or reason for visiting…"
                rows={2}
                className="input text-xs resize-none"
                id="book-reason"
              />
            </div>

            {/* Feedback */}
            {bookError && (
              <div className="alert-error text-xs">{bookError}</div>
            )}
            {bookSuccess && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                ✓ {bookSuccess}
              </div>
            )}

            {/* Submit row */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowBooking(false)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={booking}
                id="submit-book-appointment-btn"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:bg-[hsl(220,55%,28%)] disabled:opacity-60 transition-all shadow-md"
              >
                {booking ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Booking…
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Confirm Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Upcoming Appointments ───────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="section-title">Upcoming Appointments</h2>

        {upcoming.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[hsl(var(--border))] rounded-xl">
            <Calendar className="w-7 h-7 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No upcoming appointments — use the panel above to book one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => {
              const doctorName = a.provider
                ? `Dr. ${a.provider.first_name} ${a.provider.last_name}`
                : 'Unknown Provider';
              const label = a.chief_complaint || humanizeLabel(a.type);

              return (
                <div key={a.id} className="card-hover flex items-center gap-4 group relative overflow-hidden">
                  {/* Date badge */}
                  <div className="text-center min-w-[60px] rounded-xl bg-blue-500/10 border border-blue-500/20 py-2 shrink-0">
                    <p className="text-lg font-bold text-blue-300 leading-none">
                      {formatDate(a.scheduled_at, 'd')}
                    </p>
                    <p className="text-[10px] text-blue-400/70 mt-0.5">
                      {formatDate(a.scheduled_at, 'MMM yyyy')}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{label}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {doctorName}{a.provider?.specialty ? ` · ${a.provider.specialty}` : ''}
                    </p>
                    <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(a.scheduled_at, 'h:mm a')} · {a.duration_mins} min
                    </span>
                  </div>

                  {/* Status */}
                  <span className={cn('badge text-xs shrink-0', APPOINTMENT_STATUS_COLORS[a.status])}>
                    {a.status}
                  </span>

                  {/* Edit buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id={`reschedule-btn-${a.id}`}
                      onClick={() => setEditingAppt(a)}
                      title="Reschedule appointment"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[11px] font-semibold hover:bg-[hsl(var(--primary))]/20 transition-colors"
                    >
                      <CalendarClock className="w-3 h-3" />
                      <span className="hidden sm:inline">Reschedule</span>
                    </button>
                    <button
                      id={`cancel-btn-${a.id}`}
                      onClick={() => setEditingAppt(a)}
                      title="Cancel appointment"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-[11px] font-semibold hover:bg-red-500/15 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  </div>

                  <div className="absolute right-0 top-0 h-full w-0.5 bg-gradient-to-b from-[hsl(var(--primary))]/40 via-[hsl(var(--accent))]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Past Visits ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="section-title">Past Visits</h2>

        {past.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[hsl(var(--border))] rounded-xl">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No past visit records yet.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-5">Date &amp; Time</th>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((a) => (
                  <tr key={a.id}>
                    <td className="pl-5 text-xs whitespace-nowrap">
                      {formatDate(a.scheduled_at, 'MMM d, yyyy')}
                      <span className="ml-1.5 text-[hsl(var(--muted-foreground))]">
                        {formatDate(a.scheduled_at, 'h:mm a')}
                      </span>
                    </td>
                    <td className="text-xs">{a.provider ? `Dr. ${a.provider.last_name}` : '—'}</td>
                    <td className="text-xs capitalize">{humanizeLabel(a.type)}</td>
                    <td>
                      <span className={cn('badge text-xs', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Update Modal ─────────────────────────────────────────── */}
      {editingAppt && (
        <AppointmentUpdateModal
          appointmentId={editingAppt.id}
          currentScheduledAt={editingAppt.scheduled_at}
          appointmentLabel={
            editingAppt.chief_complaint
              ? editingAppt.chief_complaint
              : `${humanizeLabel(editingAppt.type)} with ${
                  editingAppt.provider ? `Dr. ${editingAppt.provider.last_name}` : 'Provider'
                }`
          }
          onClose={() => setEditingAppt(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
