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
  ArrowRight, Clock, MapPin, ShieldCheck, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PortalBookingClientProps {
  doctors: Profile[];
  profile: Profile;
  patientRecord?: any;
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

export function PortalBookingClient({ doctors, profile, patientRecord }: PortalBookingClientProps) {
  const router = useRouter();
  const [successData, setSuccessData] = useState<{ mrn: string; date: string; time: string; doctorName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: patientRecord?.phone ?? profile.phone ?? '',
      dateOfBirth: patientRecord?.date_of_birth ?? '',
      gender: patientRecord?.gender ?? 'prefer_not_to_say',
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
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center animate-fade-in space-y-6">
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-[#16A34A]/10 border-2 border-[#16A34A]/30">
          <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
            Confirmed Reservation
          </span>
          <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
            Appointment Scheduled!
          </h2>
          <p className="text-sm text-[#475569] max-w-sm mx-auto leading-relaxed">
            Your onboarding consultation has been booked and your patient record has been successfully initialized.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-lg text-left">
          <div className="p-6 border-b border-[#E2E8F0] bg-[#0891B2]/10 space-y-1">
            <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Medical Record Number (MRN)</p>
            <p className="font-mono text-3xl font-bold text-[#0B2A55] tracking-widest">
              {successData.mrn}
            </p>
            <p className="text-xs text-[#475569]">Your official permanent medical chart identifier</p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[#94A3B8] font-medium">Assigned Physician</p>
              <p className="font-bold text-[#0F172A] mt-0.5">{successData.doctorName}</p>
            </div>
            <div>
              <p className="text-[#94A3B8] font-medium">Date & Time</p>
              <p className="font-bold text-[#0F172A] mt-0.5">{successData.date} · {successData.time}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinish}
          id="finish-onboarding-btn"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0891B2] text-white text-sm font-bold hover:bg-[#0F766E] transition-all shadow-md cursor-pointer"
        >
          Enter Health Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
          Step 1: Choose Doctor
        </span>
        <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
          Select Clinical Specialist
        </h2>
        <p className="text-sm text-[#475569]">
          Choose a board-certified physician to conduct your onboarding consultation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.map((doc) => {
          const isSelected = selectedDoctorId === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoctor(doc.id)}
              className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 space-y-4 ${
                isSelected
                  ? 'bg-[#0891B2]/10 border-[#0891B2] text-[#0891B2] shadow-xl ring-2 ring-[#0891B2]/20 scale-[1.02]'
                  : 'bg-white border-[#E2E8F0] hover:border-[#14B8A6] hover:shadow-md text-[#475569]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] font-bold text-lg shrink-0">
                  {doc.first_name[0]}{doc.last_name[0]}
                </div>
                <div>
                  <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">
                    Dr. {doc.first_name} {doc.last_name}
                  </h3>
                  <p className="text-xs font-semibold text-[#0891B2]">{doc.specialty || 'General Practitioner'}</p>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  isSelected ? 'bg-[#0891B2] text-white shadow-md' : 'bg-[#F8FAFC] text-[#0891B2]'
                }`}
              >
                {isSelected ? 'Physician Selected ✓' : 'Select Physician'}
              </button>
            </div>
          );
        })}
      </div>

      <div id="booking-form-section" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div className="border-b border-[#E2E8F0] pb-4 space-y-1">
          <h3 className="font-cambria text-2xl font-bold text-[#0B2A55]">
            Consultation Details & Schedule
          </h3>
          <p className="text-xs text-[#475569]">
            Date of birth is automatically retrieved from your account profile.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name *" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name *"  error={errors.lastName?.message}  {...register('lastName')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email Address *" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Phone Number *" placeholder="555-123-4567" error={errors.phone?.message} {...register('phone')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth (Auto-Filled from DB) *"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />
            <Select
              label="Gender *"
              options={GENDER_OPTIONS}
              error={errors.gender?.message}
              {...register('gender')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Visit Type *"
              options={APPOINTMENT_TYPE_OPTIONS}
              error={errors.appointmentType?.message}
              {...register('appointmentType')}
            />
            <Input
              label="Preferred Date *"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              error={errors.date?.message}
              {...register('date')}
            />
          </div>

          <Select
            label="Preferred Time Slot *"
            options={TIME_SLOTS}
            error={errors.time?.message}
            {...register('time')}
          />

          <Textarea
            label="Chief Complaint / Reason for Visit (Optional)"
            placeholder="Briefly describe your symptoms or what you'd like to discuss during consultation…"
            error={errors.chiefComplaint?.message}
            rows={3}
            {...register('chiefComplaint')}
          />

          <input type="hidden" {...register('providerId')} />

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing Consultation…
                </>
              ) : (
                <>
                  Schedule Consultation <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
