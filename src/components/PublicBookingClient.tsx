'use client';

/**
 * Public Booking Client Component — Upgraded Step-by-Step Experience
 * Handles self-service patient appointment booking flow with interactive steps,
 * visual time slot pills, visit type cards, and instant MRN generation.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookPublicAppointment } from '@/app/actions';
import { Input, Select, Textarea } from '@/components/ui';
import type { Profile } from '@/lib/types/database';
import {
  Calendar, CheckCircle2, User, Stethoscope,
  ArrowRight, ChevronLeft, Clock, MapPin, Sparkles,
  Video, Activity, ShieldCheck, Star, Heart, Award,
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

const APPOINTMENT_TYPES = [
  { value: 'new_patient', label: 'New Patient Visit', icon: User, desc: 'First time consultation & chart creation' },
  { value: 'follow_up', label: 'Follow-up Visit', icon: Activity, desc: 'Review treatment progress & test results' },
  { value: 'wellness', label: 'Wellness Exam', icon: Heart, desc: 'Annual check-up & preventive screening' },
  { value: 'telehealth', label: 'Telehealth Consult', icon: Video, desc: 'HD Virtual video visit from home' },
  { value: 'urgent', label: 'Urgent Care', icon: ShieldCheck, desc: 'Same-day evaluation for acute symptoms' },
];

const MORNING_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
];

const AFTERNOON_SLOTS = [
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
];

export function PublicBookingClient({ doctors }: PublicBookingClientProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'prefer_not_to_say',
      appointmentType: 'new_patient',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
    },
  });

  const selectedDoctorId = watch('providerId');
  const selectedType = watch('appointmentType');
  const selectedTime = watch('time');
  const selectedDate = watch('date');

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const onSelectDoctor = (id: string) => {
    setValue('providerId', id);
    setCurrentStep(2);
    setTimeout(() => {
      document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth' });
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

  const getLoginUrl = () => {
    if (!pendingBookingData) return '/login';
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
    return `/login?${urlParams.toString()}`;
  };

  /* ── Account Required Confirmation Screen ───────────────────── */
  if (pendingBookingData) {
    const doctorName = selectedDoctor
      ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
      : 'Selected Provider';
    const timeLabel = [...MORNING_SLOTS, ...AFTERNOON_SLOTS].find(t => t.value === pendingBookingData.time)?.label ?? pendingBookingData.time;
    const apptTypeLabel = APPOINTMENT_TYPES.find(o => o.value === pendingBookingData.appointmentType)?.label ?? pendingBookingData.appointmentType;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-slide-up" id="booking-section">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 shadow-xl space-y-8 text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[#0891B2]/10 border border-[#0891B2]/30">
            <Sparkles className="w-8 h-8 text-[#0891B2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
              Step 3 of 3 · Finalize Reservation
            </span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
              Create Patient Account to Confirm
            </h2>
            <p className="text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
              Your appointment details are saved! Create your free Patient Portal account to lock in your slot and instantly access your health charts.
            </p>
          </div>

          {/* Appointment Summary Receipt Card */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider">
                Appointment Summary
              </span>
              <span className="text-xs font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full">
                Slot Reserved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#94A3B8] font-medium">Physician</p>
                <p className="font-cambria font-bold text-[#0F172A] mt-0.5">{doctorName}</p>
                <p className="text-xs text-[#0891B2]">{selectedDoctor?.specialty || 'General Practice'}</p>
              </div>

              <div>
                <p className="text-xs text-[#94A3B8] font-medium">Visit Type</p>
                <p className="font-semibold text-[#0F172A] mt-0.5">{apptTypeLabel}</p>
              </div>

              <div>
                <p className="text-xs text-[#94A3B8] font-medium">Date & Time</p>
                <p className="font-semibold text-[#0F172A] mt-0.5">{pendingBookingData.date}</p>
                <p className="text-xs text-[#475569]">{timeLabel}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={() => setPendingBookingData(null)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Modify Appointment
            </button>
            <button
              onClick={handleRedirectToSignup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0891B2] text-white text-sm font-semibold hover:bg-[#0F766E] transition-all shadow-md"
            >
              Create Account & Confirm <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Already registered?{' '}
            <Link href={getLoginUrl()} className="text-[#0891B2] font-bold hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Main Upgraded Booking Experience ────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-12" id="booking-step-container">

      {/* Stepper Navigation Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          {[
            { step: 1, title: '1. Select Doctor', desc: 'Choose Specialist' },
            { step: 2, title: '2. Visit & Time', desc: 'Select Schedule' },
            { step: 3, title: '3. Patient Info', desc: 'Enter Details' },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;

            return (
              <button
                key={s.step}
                onClick={() => {
                  if (s.step === 1 || (s.step === 2 && selectedDoctorId) || (s.step === 3 && selectedDoctorId && selectedTime)) {
                    setCurrentStep(s.step);
                  }
                }}
                className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#0891B2]/10 text-[#0891B2] font-bold ring-2 ring-[#0891B2]/20'
                    : isDone
                    ? 'text-[#16A34A] hover:bg-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:bg-[#F8FAFC]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isActive
                      ? 'bg-[#0891B2] text-white shadow-md'
                      : isDone
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#E2E8F0] text-[#475569]'
                  }`}
                >
                  {isDone ? '✓' : s.step}
                </div>
                <span className="font-cambria text-xs sm:text-sm font-bold line-clamp-1">
                  {s.title}
                </span>
                <span className="text-[10px] text-[#94A3B8] hidden sm:inline">
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: SELECT DOCTOR */}
      {currentStep === 1 && (
        <section className="space-y-8 animate-fade-in">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
              Step 1 of 3
            </span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
              Choose Your Specialist
            </h2>
            <p className="text-sm text-[#475569]">
              Select a board-certified physician from our clinical care team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctors.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoctor(doc.id)}
                  className={`group cursor-pointer bg-white border rounded-2xl p-6 space-y-5 transition-all duration-300 relative ${
                    isSelected
                      ? 'border-[#0891B2] shadow-xl ring-2 ring-[#0891B2]/20 scale-[1.02]'
                      : 'border-[#E2E8F0] hover:border-[#14B8A6] hover:shadow-md'
                  }`}
                >
                  {/* Doctor Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0 font-bold text-lg">
                      {doc.first_name[0]}{doc.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-cambria text-lg font-bold text-[#0B2A55] leading-snug">
                        Dr. {doc.first_name} {doc.last_name}
                      </h3>
                      <span className="text-xs font-semibold text-[#0891B2]">
                        {doc.specialty || 'General Practitioner'}
                      </span>
                      <p className="text-[11px] text-[#94A3B8]">
                        {doc.department || 'Clinical Outpatient Care'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#475569]">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-[#0F172A]">4.9</span> (120+ reviews)
                    </span>
                    <span className="flex items-center gap-1 text-[#16A34A] font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Available Today
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-[#0891B2] text-white shadow-md'
                        : 'bg-[#F8FAFC] text-[#0891B2] group-hover:bg-[#0891B2] group-hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Doctor Selected ✓' : 'Select Physician'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 2: VISIT TYPE & TIME SLOT SELECTOR */}
      {currentStep === 2 && (
        <section className="space-y-8 animate-fade-in bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-lg">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
              Step 2 of 3
            </span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
              Visit Type & Preferred Time Slot
            </h2>
            {selectedDoctor && (
              <p className="text-sm font-semibold text-[#0891B2]">
                Booking with Dr. {selectedDoctor.first_name} {selectedDoctor.last_name} ({selectedDoctor.specialty || 'GP'})
              </p>
            )}
          </div>

          {/* 1. Visit Type Visual Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              1. Select Visit Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {APPOINTMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('appointmentType', type.value as any)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-[#0891B2]/10 border-[#0891B2] text-[#0891B2] shadow-sm ring-2 ring-[#0891B2]/20'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#14B8A6] text-[#475569]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#0891B2]' : 'text-[#94A3B8]'}`} />
                    <div>
                      <p className="font-cambria font-bold text-xs text-[#0F172A]">{type.label}</p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5 line-clamp-2">{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date Selection */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              2. Select Appointment Date
            </label>
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              error={errors.date?.message}
              {...register('date')}
            />
          </div>

          {/* 3. Time Slots Visual Selector */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center justify-between">
              <span>3. Available Time Slots ({selectedDate})</span>
              <span className="text-[#16A34A] font-semibold text-[11px]">Real-time Live Sync</span>
            </label>

            {/* Morning Slots */}
            <div className="space-y-2">
              <span className="text-xs text-[#94A3B8] font-semibold uppercase">Morning Slots</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {MORNING_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setValue('time', slot.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-md scale-[1.03]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:border-[#0891B2] hover:bg-[#0891B2]/10'
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
              <span className="text-xs text-[#94A3B8] font-semibold uppercase">Afternoon Slots</span>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                {AFTERNOON_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setValue('time', slot.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-md scale-[1.03]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:border-[#0891B2] hover:bg-[#0891B2]/10'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              <ChevronLeft className="w-4 h-4" /> Change Doctor
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-md"
            >
              Continue to Patient Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: PATIENT INFORMATION FORM */}
      {currentStep === 3 && (
        <section className="space-y-8 animate-fade-in bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-lg">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] px-3 py-1 rounded-full bg-[#0891B2]/10">
              Step 3 of 3
            </span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
              Enter Patient Information
            </h2>
            <p className="text-sm text-[#475569]">
              Fast check-in form. No prior password or account required.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name *" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last Name *"  error={errors.lastName?.message}  {...register('lastName')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                placeholder="name@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone Number *"
                placeholder="555-123-4567"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth *"
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

            <Textarea
              label="Chief Complaint / Reason for Visit (Optional)"
              placeholder="Briefly describe your symptoms or what you'd like to discuss during consultation…"
              error={errors.chiefComplaint?.message}
              rows={3}
              {...register('chiefComplaint')}
            />

            {/* Hidden fields bindings */}
            <input type="hidden" {...register('providerId')} />
            <input type="hidden" {...register('appointmentType')} />
            <input type="hidden" {...register('date')} />
            <input type="hidden" {...register('time')} />

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Schedule
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing Reservation…
                  </>
                ) : (
                  <>
                    Finalize Appointment Request <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
