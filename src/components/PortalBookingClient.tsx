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
  ArrowRight, Clock, MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PortalBookingClientProps {
  doctors: Profile[];
  profile: Profile;
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

export function PortalBookingClient({ doctors, profile }: PortalBookingClientProps) {
  const router = useRouter();
  const [successData, setSuccessData] = useState<{ mrn: string; date: string; time: string; doctorName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
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
    setError(null);
    try {
      const scheduledAt = new Date(`${data.date}T${data.time}:00`).toISOString();
      const result = await bookPublicAppointment({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        providerId: data.providerId,
        appointmentType: data.appointmentType,
        scheduledAt,
        chiefComplaint: data.chiefComplaint,
      });

      if (result && 'error' in result && result.error) {
        setError(String(result.error));
        return;
      }

      setSuccessData({
        mrn: (result as any).mrn || '',
        date: data.date,
        time: TIME_SLOTS.find(t => t.value === data.time)?.label || data.time,
        doctorName: doctors.find(d => d.id === data.providerId)
          ? `Dr. ${doctors.find(d => d.id === data.providerId)?.first_name} ${doctors.find(d => d.id === data.providerId)?.last_name}`
          : 'Selected Provider',
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const handleFinish = () => {
    router.refresh();
    // Fallback to reload to ensure patient state clears
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /* ── Success Screen ───────────────────────────────────────────── */
  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30">
          <CheckCircle2 className="w-9 h-9 text-emerald-500" />
        </div>

        <SectionLabel>Confirmed</SectionLabel>
        <h2 className="font-display text-3xl font-600 text-[hsl(var(--foreground))] mb-3">
          Appointment Scheduled!
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto mb-8 leading-relaxed">
          Your appointment has been registered and your patient record has been successfully initialized.
        </p>

        {/* MRN + details card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-[hsl(var(--border-muted))] bg-[hsl(var(--primary))]/4">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]">Medical Record Number (MRN)</p>
            <p className="font-mono text-3xl font-bold text-[hsl(var(--primary))] mt-1 select-all tracking-widest">
              {successData.mrn}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]/70 mt-1">Your new permanent medical record number</p>
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

        <button
          onClick={handleFinish}
          id="finish-onboarding-btn"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(220,55%,28%)] transition-all shadow-md cursor-pointer"
        >
          Enter Health Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ── Main View: Doctor Grid + Form ───────────────────────────── */
  return (
    <div className="space-y-12">
      {/* ─── Doctors Grid ─────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <SectionLabel>Our Clinical Team</SectionLabel>
          <h2 className="font-display text-2xl font-600 text-[hsl(var(--foreground))]">
            Meet Our Doctors
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Select a specialist from our care team below to schedule your visit.
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[hsl(var(--border))] rounded-2xl">
            <Stethoscope className="w-10 h-10 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-3" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No doctors available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/30">
                      <CheckCircle2 className="w-3 h-3 text-[hsl(var(--accent))]" />
                      <span className="text-[9px] font-semibold text-[hsl(var(--accent))]">Selected</span>
                    </div>
                  )}

                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[hsl(var(--primary))]/8 border border-[hsl(var(--primary))]/15 flex items-center justify-center shrink-0">
                        {doc.avatar_url ? (
                          <img
                            src={doc.avatar_url}
                            alt={`${doc.first_name} ${doc.last_name}`}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Stethoscope className="w-5 h-5 text-[hsl(var(--primary))]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-semibold text-[hsl(var(--foreground))] leading-snug">
                          Dr. {doc.first_name} {doc.last_name}
                        </h3>
                        <p className="text-[11px] font-medium text-[hsl(var(--accent))] truncate">
                          {doc.specialty || 'General Practitioner'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[hsl(var(--border-muted))] space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                        <MapPin className="w-3 h-3 shrink-0 text-[hsl(var(--accent))]/60" />
                        In-person & Telehealth
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                        <Clock className="w-3 h-3 shrink-0 text-[hsl(var(--accent))]/60" />
                        30 min avg. appointment
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <button
                      onClick={() => onSelectDoctor(doc.id)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))]'
                          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(220,55%,28%)] shadow-sm'
                      }`}
                    >
                      {isSelected ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Doctor Selected</>
                      ) : (
                        <>Select Doctor <ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Booking Form ─────────────────────────────────────── */}
      <section id="booking-form-section" className="max-w-xl mx-auto scroll-mt-24">
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[hsl(var(--border-muted))] flex items-center gap-3 bg-[hsl(var(--primary))]/3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/15">
              <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-[hsl(var(--foreground))]">Appointment Details</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Complete details to automatically initialize health chart</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-6 space-y-6">
            {/* Personal Information (Pre-populated) */}
            <div className="space-y-4">
              <FieldGroup label="Personal Details" icon={User} />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">First Name</label>
                  <input
                    type="text"
                    readOnly
                    className="input w-full bg-[hsl(var(--surface-hover))] cursor-not-allowed opacity-80 text-xs"
                    {...register('firstName')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Last Name</label>
                  <input
                    type="text"
                    readOnly
                    className="input w-full bg-[hsl(var(--surface-hover))] cursor-not-allowed opacity-80 text-xs"
                    {...register('lastName')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    className="input w-full bg-[hsl(var(--surface-hover))] cursor-not-allowed opacity-80 text-xs"
                    {...register('email')}
                  />
                </div>
                <Input
                  label="Phone Number *"
                  placeholder="555-123-4567"
                  className="text-xs"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth *"
                  type="date"
                  className="text-xs"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth')}
                />
                <Select
                  label="Gender *"
                  options={GENDER_OPTIONS}
                  className="text-xs"
                  error={errors.gender?.message}
                  {...register('gender')}
                />
              </div>
            </div>

            {/* Visit Details */}
            <div className="space-y-4">
              <FieldGroup label="Appointment Details" icon={Stethoscope} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Doctor *"
                  options={[
                    { value: '', label: 'Choose a physician…' },
                    ...doctors.map(d => ({
                      value: d.id,
                      label: `Dr. ${d.first_name} ${d.last_name} · ${d.specialty || 'GP'}`,
                    })),
                  ]}
                  className="text-xs"
                  error={errors.providerId?.message}
                  {...register('providerId')}
                />
                <Select
                  label="Visit Type *"
                  options={APPOINTMENT_TYPE_OPTIONS}
                  className="text-xs"
                  error={errors.appointmentType?.message}
                  {...register('appointmentType')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date *"
                  type="date"
                  className="text-xs"
                  error={errors.date?.message}
                  {...register('date')}
                />
                <Select
                  label="Time Slot *"
                  options={[{ value: '', label: 'Select slot…' }, ...TIME_SLOTS]}
                  className="text-xs"
                  error={errors.time?.message}
                  {...register('time')}
                />
              </div>

              <Textarea
                label="Reason for Visit (optional)"
                placeholder="Briefly describe your symptoms..."
                error={errors.chiefComplaint?.message}
                rows={2}
                className="text-xs"
                {...register('chiefComplaint')}
              />
            </div>

            {error && (
              <div className="alert-error text-xs">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold tracking-wide hover:bg-[hsl(220,55%,28%)] disabled:opacity-60 transition-all duration-200 shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Scheduling…
                </>
              ) : (
                <>Schedule Onboarding Appointment <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
