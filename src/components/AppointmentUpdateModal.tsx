'use client';

import { useState, useEffect, useRef } from 'react';
import { updateAppointment } from '@/app/actions';
import {
  X, CalendarClock, XCircle, AlertTriangle,
  CheckCircle2, Clock, Save, ChevronRight,
} from 'lucide-react';

interface AppointmentUpdateModalProps {
  /** Appointment record ID */
  appointmentId: string;
  /** ISO date-time string of the current scheduled time */
  currentScheduledAt: string;
  /** Human-friendly label shown in the header */
  appointmentLabel?: string;
  /** Called when modal should close (with no action taken) */
  onClose: () => void;
  /** Called after a successful update so the parent can refresh */
  onSuccess: () => void;
}

type Mode = 'reschedule' | 'cancel';

const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
];

/** Format an ISO string as YYYY-MM-DD for a date input */
function isoToDateInput(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/** Format an ISO string as HH:MM for a time comparison */
function isoToTimeSlot(iso: string) {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '09:00';
  }
}

export function AppointmentUpdateModal({
  appointmentId,
  currentScheduledAt,
  appointmentLabel = 'Appointment',
  onClose,
  onSuccess,
}: AppointmentUpdateModalProps) {
  const [mode, setMode] = useState<Mode>('reschedule');
  const [date, setDate] = useState(isoToDateInput(currentScheduledAt));
  const [time, setTime] = useState(isoToTimeSlot(currentScheduledAt));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let scheduledAt: string | undefined;

      if (mode === 'reschedule') {
        if (!date || !time) {
          setError('Please select both a date and a time slot.');
          setSaving(false);
          return;
        }
        scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      }

      const result = await updateAppointment({
        appointmentId,
        status: mode === 'cancel' ? 'cancelled' : 'scheduled',
        scheduledAt,
        reason: reason.trim() || undefined,
      });

      if ('error' in result) {
        setError(result.error);
        return;
      }

      setDone(true);
      // Brief success moment, then surface to parent
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // ── Minimum date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    /* ── Backdrop ─────────────────────────────────────────────────── */
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* ── Modal Panel ─────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Update ${appointmentLabel}`}
        className="relative w-full max-w-md bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* ── Gradient accent bar ─────────────────────────────────── */}
        <div className="h-1 w-full bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))]" />

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[hsl(var(--border-muted))]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))]">
              <CalendarClock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">Update Appointment</h2>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate max-w-[220px]">
                {appointmentLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Mode tabs ───────────────────────────────────────────── */}
        <div className="flex border-b border-[hsl(var(--border-muted))] px-6 pt-4 gap-1">
          <button
            type="button"
            onClick={() => { setMode('reschedule'); setError(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-all duration-200 ${
              mode === 'reschedule'
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Reschedule
          </button>
          <button
            type="button"
            onClick={() => { setMode('cancel'); setError(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-all duration-200 ${
              mode === 'cancel'
                ? 'border-red-500 text-red-400 bg-red-500/5'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel Appointment
          </button>
        </div>

        {/* ── Form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

          {/* Success state */}
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {mode === 'cancel' ? 'Appointment Cancelled' : 'Appointment Rescheduled'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Updating your schedule…</p>
            </div>
          ) : (
            <>
              {/* Reschedule fields */}
              {mode === 'reschedule' && (
                <div className="space-y-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Choose a new date and time for this appointment. The assigned doctor will be notified automatically.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[hsl(var(--foreground))]">New Date <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        required
                        min={minDate}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input text-xs"
                        id="reschedule-date"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[hsl(var(--foreground))]">Time Slot <span className="text-red-400">*</span></label>
                      <select
                        required
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="input text-xs"
                        id="reschedule-time"
                      >
                        {TIME_SLOTS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel warning */}
              {mode === 'cancel' && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-400">Confirm Cancellation</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">
                      This will mark the appointment as cancelled. The doctor will be notified. This action can be reversed by staff if needed.
                    </p>
                  </div>
                </div>
              )}

              {/* Optional reason — shared by both modes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Reason <span className="text-[hsl(var(--muted-foreground))] font-normal">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={
                    mode === 'cancel'
                      ? 'e.g. Patient request, scheduling conflict…'
                      : 'e.g. Patient unavailable on original date…'
                  }
                  rows={3}
                  id="update-reason"
                  className="input text-xs resize-none"
                />
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-70">
                  This reason will be recorded in the appointment notes for audit purposes.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/20 transition-all disabled:opacity-50"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  id="confirm-appointment-update-btn"
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 shadow-md ${
                    mode === 'cancel'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-[hsl(var(--primary))] hover:bg-[hsl(220,55%,28%)] text-[hsl(var(--primary-foreground))]'
                  }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : mode === 'cancel' ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Appointment
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Confirm Reschedule
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
