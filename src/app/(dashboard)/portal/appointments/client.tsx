'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, APPOINTMENT_STATUS_COLORS, humanizeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AppointmentUpdateModal } from '@/components/AppointmentUpdateModal';
import type { AppointmentStatus, Profile } from '@/lib/types/database';
import {
  CalendarClock, XCircle, Clock, Calendar,
  CalendarPlus, ChevronRight, User, Stethoscope,
  CheckCircle2, Sparkles, AlertCircle, ArrowRight,
  ShieldCheck, MapPin, Video, Activity, Phone
} from 'lucide-react';
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
  patientRecord?: any;
}

const APPT_TYPE_OPTIONS = [
  { value: 'follow_up',   label: 'Follow-up Visit', icon: Activity, desc: 'Review treatment & test results' },
  { value: 'new_patient', label: 'New Patient Visit', icon: User, desc: 'First time consultation' },
  { value: 'wellness',    label: 'Wellness Exam', icon: Sparkles, desc: 'Routine check-up & screening' },
  { value: 'telehealth',  label: 'Telehealth Consult', icon: Video, desc: 'HD Virtual video consultation' },
  { value: 'urgent',      label: 'Urgent Care', icon: ShieldCheck, desc: 'Same-day evaluation' },
];

const MORNING_SLOTS = [
  { value: '09:00', label: '9:00 AM' },  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' }, { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' }, { value: '11:30', label: '11:30 AM' },
];

const AFTERNOON_SLOTS = [
  { value: '13:00', label: '1:00 PM' },  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
];

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function PortalAppointmentsClient({
  upcoming, past, doctors, profile, patientRecord
}: PortalAppointmentsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Active Tab: 'upcoming' | 'past' | 'book'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'book'>('upcoming');

  // Appointment update modal
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // DOB fetched directly from patientRecord in database!
  const fetchedDob = patientRecord?.date_of_birth ?? '';
  const fetchedPhone = patientRecord?.phone ?? profile.phone ?? '';
  const fetchedGender = patientRecord?.gender ?? 'prefer_not_to_say';

  // Book new appointment form state
  const [bookForm, setBookForm] = useState({
    providerId: doctors[0]?.id ?? '',
    appointmentType: 'follow_up',
    date: minDate(),
    time: '10:00',
    chiefComplaint: '',
    phone: fetchedPhone,
    dateOfBirth: fetchedDob,
    gender: fetchedGender,
  });

  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    setBookError(null);
    setBookSuccess(null);

    try {
      if (!bookForm.providerId) { setBookError('Please select a physician.'); return; }
      if (!bookForm.date)       { setBookError('Please select an appointment date.'); return; }

      // Use fetched DOB from DB if available, else user entry
      const dobToUse = bookForm.dateOfBirth || fetchedDob;
      if (!dobToUse) { setBookError('Please enter or confirm your date of birth.'); return; }

      const scheduledAt = new Date(`${bookForm.date}T${bookForm.time}:00`).toISOString();

      const result = await bookPublicAppointment({
        firstName: profile.first_name,
        lastName:  profile.last_name,
        email:     profile.email,
        phone:     bookForm.phone || profile.phone || '',
        dateOfBirth: dobToUse,
        gender:    bookForm.gender as any,
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
      const timeLabel = [...MORNING_SLOTS, ...AFTERNOON_SLOTS].find(t => t.value === bookForm.time)?.label ?? bookForm.time;
      setBookSuccess(`Appointment booked with Dr. ${doc?.last_name ?? ''} on ${bookForm.date} at ${timeLabel}!`);

      setTimeout(() => {
        setBookSuccess(null);
        setActiveTab('upcoming');
        startTransition(() => router.refresh());
      }, 2000);
    } catch (err: any) {
      setBookError(err.message || 'An unexpected error occurred.');
    } finally {
      setBooking(false);
    }
  };

  const handleSuccess = useCallback(() => {
    setEditingAppt(null);
    startTransition(() => router.refresh());
  }, [router]);

  return (
    <div className="space-y-8">

      {/* ── Navigation Tabs ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-3 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-[#0891B2] text-white shadow-md'
                : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
            }`}
          >
            <Calendar className="w-4 h-4" /> Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'past'
                ? 'bg-[#0891B2] text-white shadow-md'
                : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
            }`}
          >
            <Clock className="w-4 h-4" /> History ({past.length})
          </button>
        </div>

        <button
          onClick={() => setActiveTab('book')}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'book'
              ? 'bg-[#0B2A55] text-white shadow-md'
              : 'bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white hover:opacity-95 shadow-sm'
          }`}
        >
          <CalendarPlus className="w-4 h-4" /> + Book New Appointment
        </button>
      </div>

      {/* ── TAB 1: UPCOMING APPOINTMENTS ───────────────────────────── */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4 animate-fade-in">
          {upcoming.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-3xl space-y-4">
              <Calendar className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">No Upcoming Appointments</h3>
                <p className="text-xs text-[#475569]">Schedule a consultation with your doctor in just a few clicks.</p>
              </div>
              <button
                onClick={() => setActiveTab('book')}
                className="px-6 py-2.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-md inline-flex items-center gap-2"
              >
                <CalendarPlus className="w-4 h-4" /> Book Appointment Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((appt) => {
                const docName = appt.provider
                  ? `Dr. ${appt.provider.first_name} ${appt.provider.last_name}`
                  : 'Assigned Physician';
                const docSpec = appt.provider?.specialty ?? 'General Practitioner';

                return (
                  <div
                    key={appt.id}
                    className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm hover:border-[#0891B2] hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold border border-[#16A34A]/20 uppercase">
                          {humanizeLabel(appt.status)}
                        </span>
                        <span className="text-xs text-[#94A3B8] font-mono">
                          Duration: {appt.duration_mins} min
                        </span>
                      </div>

                      {/* Doctor & Compliant */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0 font-bold">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">
                            {docName}
                          </h3>
                          <p className="text-xs text-[#0891B2] font-semibold">{docSpec}</p>
                          <p className="text-xs text-[#475569] mt-1 font-medium">
                            Reason: {appt.chief_complaint ?? humanizeLabel(appt.type)}
                          </p>
                        </div>
                      </div>

                      {/* Scheduled Date Box */}
                      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9] flex items-center gap-3">
                        <CalendarClock className="w-5 h-5 text-[#0891B2] shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[#0B2A55]">
                            {formatDate(appt.scheduled_at, 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-xs text-[#475569]">
                            {formatDate(appt.scheduled_at, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-3">
                      <button
                        onClick={() => setEditingAppt(appt)}
                        className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                      >
                        Reschedule / Update
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PAST HISTORY ────────────────────────────────────── */}
      {activeTab === 'past' && (
        <div className="space-y-4 animate-fade-in">
          {past.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-3xl">
              <p className="text-xs text-[#94A3B8]">No past appointment history recorded.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-3">
              {past.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9] opacity-80"
                >
                  <div className="flex items-center gap-3.5">
                    <Clock className="w-4 h-4 text-[#94A3B8]" />
                    <div>
                      <p className="font-cambria font-bold text-sm text-[#0B2A55]">
                        Dr. {appt.provider?.first_name} {appt.provider?.last_name} ({appt.provider?.specialty || 'GP'})
                      </p>
                      <p className="text-xs text-[#475569]">
                        {formatDate(appt.scheduled_at, 'MMM d, yyyy · h:mm a')} — {appt.chief_complaint ?? humanizeLabel(appt.type)}
                      </p>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border', APPOINTMENT_STATUS_COLORS[appt.status])}>
                    {humanizeLabel(appt.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: BOOK NEW APPOINTMENT FORM ────────────────────────── */}
      {activeTab === 'book' && (
        <form onSubmit={handleBook} className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 animate-fade-in">
          <div className="border-b border-[#E2E8F0] pb-5 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
              Self-Service Booking
            </span>
            <h2 className="font-cambria text-2xl font-bold text-[#0B2A55]">Book New Consultation</h2>
            <p className="text-xs text-[#475569]">
              Choose physician, visit type, and preferred slot. Date of birth is automatically retrieved from your patient record.
            </p>
          </div>

          {/* 1. Physician Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              1. Choose Clinical Specialist *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {doctors.map((doc) => {
                const isSelected = bookForm.providerId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setBookForm(f => ({ ...f, providerId: doc.id }))}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#0891B2]/10 border-[#0891B2] text-[#0891B2] shadow-sm ring-2 ring-[#0891B2]/20'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#0891B2] text-[#475569]'
                    }`}
                  >
                    <p className="font-cambria font-bold text-sm text-[#0B2A55]">
                      Dr. {doc.first_name} {doc.last_name}
                    </p>
                    <p className="text-xs font-semibold text-[#0891B2] mt-0.5">{doc.specialty || 'General Practitioner'}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{doc.department || 'Outpatient Clinic'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Visit Type Selector */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              2. Select Visit Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {APPT_TYPE_OPTIONS.map((type) => {
                const Icon = type.icon;
                const isSelected = bookForm.appointmentType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setBookForm(f => ({ ...f, appointmentType: type.value }))}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#0891B2]/10 border-[#0891B2] text-[#0891B2] ring-2 ring-[#0891B2]/20 font-bold'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#0891B2]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[#0891B2]' : 'text-[#94A3B8]'}`} />
                    <p className="font-cambria font-bold text-xs text-[#0F172A]">{type.label}</p>
                    <p className="text-[10px] text-[#94A3B8]">{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Date & Time Selection */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              3. Select Appointment Date & Time Slot *
            </label>

            <input
              type="date"
              min={minDate()}
              value={bookForm.date}
              onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))}
              className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#0891B2] outline-none"
            />

            {/* Morning Slots */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase text-[#94A3B8]">Morning Slots</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {MORNING_SLOTS.map((slot) => {
                  const isSelected = bookForm.time === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setBookForm(f => ({ ...f, time: slot.value }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-md scale-[1.02]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:border-[#0891B2]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon Slots */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase text-[#94A3B8]">Afternoon Slots</span>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                {AFTERNOON_SLOTS.map((slot) => {
                  const isSelected = bookForm.time === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setBookForm(f => ({ ...f, time: slot.value }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-md scale-[1.02]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:border-[#0891B2]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. AUTO-FETCHED PATIENT DATA SNAPSHOT FROM DATABASE */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-bold text-[#0B2A55] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                4. Patient Information (Auto-Fetched from Database)
              </span>
              <span className="text-[11px] font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full">
                ✓ Verified DB Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[#94A3B8] font-medium">Patient Name</p>
                <p className="font-bold text-[#0F172A] mt-0.5">{profile.first_name} {profile.last_name}</p>
              </div>

              <div>
                <p className="text-[#94A3B8] font-medium">Date of Birth (DOB)</p>
                <p className="font-bold text-[#0891B2] mt-0.5">
                  {fetchedDob ? formatDate(fetchedDob) : 'Will prompt on record creation'}
                </p>
              </div>

              <div>
                <p className="text-[#94A3B8] font-medium">Contact Phone</p>
                <p className="font-bold text-[#0F172A] mt-0.5">{fetchedPhone || 'Not provided'}</p>
              </div>
            </div>

            {/* Hidden / Backup DOB input if missing */}
            {!fetchedDob && (
              <div className="pt-2">
                <label className="text-xs font-bold text-[#0F172A]">Date of Birth *</label>
                <input
                  type="date"
                  value={bookForm.dateOfBirth}
                  onChange={e => setBookForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]"
                />
              </div>
            )}
          </div>

          {/* Reason / Chief Complaint */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0F172A]">Chief Complaint / Symptoms (Optional)</label>
            <textarea
              rows={2}
              placeholder="Briefly describe your symptoms or what you'd like to discuss during consultation…"
              value={bookForm.chiefComplaint}
              onChange={e => setBookForm(f => ({ ...f, chiefComplaint: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>

          {bookError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold">
              {bookError}
            </div>
          )}

          {bookSuccess && (
            <div className="p-3.5 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {bookSuccess}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={booking}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {booking ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Finalizing Reservation…
                </>
              ) : (
                <>
                  Confirm & Book Visit <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Appointment Reschedule / Update Modal ───────────────── */}
      {editingAppt && (
        <AppointmentUpdateModal
          appointmentId={editingAppt.id}
          currentScheduledAt={editingAppt.scheduled_at}
          appointmentLabel={editingAppt.chief_complaint ?? editingAppt.type}
          onClose={() => setEditingAppt(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
