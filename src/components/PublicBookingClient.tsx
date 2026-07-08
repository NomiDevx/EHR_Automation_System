'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookPublicAppointment } from '@/app/actions';
import { Input, Select, Textarea } from '@/components/ui';
import type { Profile } from '@/lib/types/database';
import {
  Calendar, CheckCircle2, User, Stethoscope,
  ArrowRight, ChevronLeft, Clock, MapPin,
} from 'lucide-react';
import Link from 'next/link';

interface PublicBookingClientProps {
  doctors: Profile[];
}

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'non_binary', 'other', 'prefer_not_to_say']),
  providerId: z.string().min(1, 'Please select a doctor'),
  appointmentType: z.enum(['new_patient', 'follow_up', 'urgent', 'telehealth', 'procedure', 'wellness']),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  chiefComplaint: z.string().optional(),
});

type BookingFormData = z.infer<typeof schema>;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'new_patient', label: 'New Patient Visit' },
  { value: 'follow_up', label: 'Follow-up Visit' },
  { value: 'wellness', label: 'Wellness Exam' },
  { value: 'telehealth', label: 'Telehealth Consult' },
  { value: 'urgent', label: 'Urgent Care' },
];

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

/* ── Small helpers ──────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-1">
      {children}
    </p>
  );
}

function FieldGroup({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-2 border-b border-[hsl(var(--border-muted))]">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[hsl(var(--primary))]/8 border border-[hsl(var(--primary))]/15">
        <Icon className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
      </span>
      <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">{label}</h4>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export function PublicBookingClient({ doctors }: PublicBookingClientProps) {
  const [successData, setSuccessData] = useState<{ mrn: string; date: string; time: string; doctorName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'prefer_not_to_say',
      appointmentType: 'new_patient',
    },
  });

  const selectedDoctorId = watch('providerId');

  const onSelectDoctor = (id: string) => {
    setValue('providerId', id);
    setTimeout(() => {
      document.getElementById('booking-form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const onSubmit = async (data: BookingFormData) => {
    setPendingBookingData(data);
  };

  const handleRedirectToSignup = () => {
    if (!pendingBookingData) return;
    const urlParams = new URLSearchParams({
      booking: 'true',
      firstName: pendingBookingData.firstName,
      lastName: pendingBookingData.lastName,
      email: pendingBookingData.email,
      phone: pendingBookingData.phone,
      dob: pendingBookingData.dateOfBirth,
      gender: pendingBookingData.gender,
      providerId: pendingBookingData.providerId,
      appointmentType: pendingBookingData.appointmentType,
      date: pendingBookingData.date,
      time: pendingBookingData.time,
      chiefComplaint: pendingBookingData.chiefComplaint || '',
    });
    window.location.href = `/signup?${urlParams.toString()}`;
  };

  /* ── Account Required Prompt ──────────────────────────────────── */
  if (pendingBookingData) {
    const doctor = doctors.find(d => d.id === pendingBookingData.providerId);
    const doctorName = doctor
      ? `Dr. ${doctor.first_name} ${doctor.last_name}`
      : 'Selected Provider';
    const timeLabel = TIME_SLOTS.find(t => t.value === pendingBookingData.time)?.label ?? pendingBookingData.time;
    const apptTypeLabel = APPOINTMENT_TYPE_OPTIONS.find(o => o.value === pendingBookingData.appointmentType)?.label ?? pendingBookingData.appointmentType;

    return (
      <div className="max-w-xl mx-auto py-10 px-4 animate-slide-up" id="booking-section">
        {/* Section label */}
        <div className="text-center mb-8">
          <SectionLabel>One More Step</SectionLabel>
          <h2 className="font-display text-3xl font-600 text-[hsl(var(--foreground))]">
            Patient Account Required
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3 max-w-md mx-auto leading-relaxed">
            To finalise your appointment, please register for a free Patient Portal account.
            Your booking details are saved and will be confirmed immediately upon sign-up.
          </p>
        </div>

        {/* Appointment summary card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden mb-6">
          {/* Header strip */}
          <div className="px-6 py-4 border-b border-[hsl(var(--border-muted))] bg-[hsl(var(--accent))]/5 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/25">
              <Calendar className="w-4 h-4 text-[hsl(var(--accent))]" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Appointment Summary</p>
              <p className="font-display text-base font-semibold text-[hsl(var(--foreground))] mt-0.5">{doctorName}</p>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Type</p>
              <p className="font-medium text-[hsl(var(--foreground))]">{apptTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Date</p>
              <p className="font-medium text-[hsl(var(--foreground))]">{pendingBookingData.date}</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Time</p>
              <p className="font-medium text-[hsl(var(--foreground))]">{timeLabel}</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setPendingBookingData(null)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Modify Details
          </button>
          <button
            onClick={handleRedirectToSignup}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(220,55%,28%)] transition-all shadow-md"
          >
            Create Account & Confirm <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-5 opacity-60">
          Already have an account?{' '}
          <Link href="/login" className="text-[hsl(var(--accent))] hover:underline underline-offset-2">Sign in</Link>
          {' '}and your booking will be linked automatically.
        </p>
      </div>
    );
  }

  /* ── Success Screen ───────────────────────────────────────────── */
  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center animate-slide-up">
        {/* Check ring */}
        <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30">
          <CheckCircle2 className="w-9 h-9 text-emerald-500" />
        </div>

        <SectionLabel>Confirmed</SectionLabel>
        <h2 className="font-display text-3xl font-600 text-[hsl(var(--foreground))] mb-3">
          Appointment Scheduled!
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto mb-8 leading-relaxed">
          Your appointment is registered in our system. No account is needed for your visit — just bring your MRN below.
        </p>

        {/* MRN + details card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-[hsl(var(--border-muted))] bg-[hsl(var(--primary))]/4">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]">Medical Record Number (MRN)</p>
            <p className="font-mono text-3xl font-bold text-[hsl(var(--primary))] mt-1 select-all tracking-widest">
              {successData.mrn}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]/70 mt-1">Keep this for check-in reference</p>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4 text-left text-sm">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Doctor</p>
              <p className="font-semibold text-[hsl(var(--foreground))]">{successData.doctorName}</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Date & Time</p>
              <p className="font-semibold text-[hsl(var(--foreground))]">{successData.date} · {successData.time}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => setSuccessData(null)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all"
          >
            Book Another
          </button>
          <Link href="/login">
            <span className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(220,55%,28%)] transition-all shadow-md cursor-pointer">
              Go to Portal <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main View: Doctor Grid + Form ───────────────────────────── */
  return (
    <div className="space-y-20">

      {/* ─── Doctors Grid ─────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <SectionLabel>Our Clinical Team</SectionLabel>
          <h2 className="font-display text-3xl sm:text-4xl font-600 text-[hsl(var(--foreground))]">
            Meet Our Doctors
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            Select a specialist from our care team below to schedule your visit.
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[hsl(var(--border))] rounded-2xl">
            <Stethoscope className="w-10 h-10 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No doctors available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`group relative bg-[hsl(var(--surface))] border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                    isSelected
                      ? 'border-[hsl(var(--accent))]/50 shadow-lg shadow-[hsl(var(--accent))]/5'
                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/30 hover:shadow-md'
                  }`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/30">
                      <CheckCircle2 className="w-3 h-3 text-[hsl(var(--accent))]" />
                      <span className="text-[10px] font-semibold text-[hsl(var(--accent))]">Selected</span>
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-6 flex-1 space-y-4">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[hsl(var(--primary))]/8 border border-[hsl(var(--primary))]/15 flex items-center justify-center shrink-0">
                        {doc.avatar_url ? (
                          <img
                            src={doc.avatar_url}
                            alt={`${doc.first_name} ${doc.last_name}`}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Stethoscope className="w-6 h-6 text-[hsl(var(--primary))]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-[hsl(var(--foreground))] leading-snug">
                          Dr. {doc.first_name} {doc.last_name}
                        </h3>
                        <p className="text-xs font-medium text-[hsl(var(--accent))] mt-0.5 truncate">
                          {doc.specialty || 'General Practitioner'}
                        </p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                          {doc.department || 'Clinical Care'}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pt-3 border-t border-[hsl(var(--border-muted))] space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[hsl(var(--accent))]/60" />
                        In-person & Telehealth
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[hsl(var(--accent))]/60" />
                        30 min avg. appointment
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => onSelectDoctor(doc.id)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))]'
                          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(220,55%,28%)] shadow-sm'
                      }`}
                    >
                      {isSelected ? (
                        <><CheckCircle2 className="w-4 h-4" /> Doctor Selected</>
                      ) : (
                        <>Book with Doctor <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  {/* Bottom gold line on hover/selected */}
                  <div className={`h-px w-full bg-gradient-to-r from-[hsl(var(--accent))] to-transparent transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Booking Form ─────────────────────────────────────── */}
      <section id="booking-form-section" className="max-w-2xl mx-auto scroll-mt-24">
        {/* Section header */}
        <div className="text-center mb-10">
          <SectionLabel>Schedule a Visit</SectionLabel>
          <h2 className="font-display text-3xl sm:text-4xl font-600 text-[hsl(var(--foreground))]">
            Book an Appointment
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            No account required. Fill in your details and we'll confirm your visit.
          </p>
        </div>

        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden">
          {/* Form header bar */}
          <div className="px-6 sm:px-8 py-5 border-b border-[hsl(var(--border-muted))] flex items-center gap-3 bg-[hsl(var(--primary))]/3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/15">
              <Calendar className="w-4.5 h-4.5 text-[hsl(var(--primary))]" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-[hsl(var(--foreground))]">Appointment Request</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No account needed · Takes about 2 minutes</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 sm:px-8 py-7 space-y-8">

            {/* Personal Information */}
            <div className="space-y-4">
              <FieldGroup label="Personal Information" icon={User} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
                <Input label="Last Name"  error={errors.lastName?.message}  {...register('lastName')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="name@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Phone number"
                  placeholder="555-123-4567"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date of birth"
                  type="date"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth')}
                />
                <Select
                  label="Gender"
                  options={GENDER_OPTIONS}
                  error={errors.gender?.message}
                  {...register('gender')}
                />
              </div>
            </div>

            {/* Visit Information */}
            <div className="space-y-4">
              <FieldGroup label="Visit Information" icon={Stethoscope} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Select Doctor"
                  options={[
                    { value: '', label: 'Choose a physician…' },
                    ...doctors.map(d => ({
                      value: d.id,
                      label: `Dr. ${d.first_name} ${d.last_name} · ${d.specialty || 'GP'}`,
                    })),
                  ]}
                  error={errors.providerId?.message}
                  {...register('providerId')}
                />
                <Select
                  label="Visit Type"
                  options={APPOINTMENT_TYPE_OPTIONS}
                  error={errors.appointmentType?.message}
                  {...register('appointmentType')}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Preferred Date"
                  type="date"
                  error={errors.date?.message}
                  {...register('date')}
                />
                <Select
                  label="Preferred Time"
                  options={[{ value: '', label: 'Select time slot…' }, ...TIME_SLOTS]}
                  error={errors.time?.message}
                  {...register('time')}
                />
              </div>
              <Textarea
                label="Reason for Visit (optional)"
                placeholder="Briefly describe your symptoms or reason for visiting…"
                error={errors.chiefComplaint?.message}
                rows={3}
                {...register('chiefComplaint')}
              />
            </div>

            {error && (
              <div className="alert-error text-sm">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold tracking-wide hover:bg-[hsl(220,55%,28%)] disabled:opacity-60 transition-all duration-200 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>Request Appointment <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-[hsl(var(--muted-foreground))] opacity-60">
              By submitting, you agree our staff may contact you to confirm scheduling.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
