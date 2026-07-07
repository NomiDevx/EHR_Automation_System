'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookPublicAppointment } from '@/app/actions';
import { Input, Select, Button, Card, Textarea } from '@/components/ui';
import type { Profile } from '@/lib/types/database';
import { Calendar, CheckCircle2, User, Stethoscope, ChevronRight } from 'lucide-react';
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

// Generates time slots every 30 minutes from 9 AM to 4:30 PM
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
  { value: '14:30', label: '2:40 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
];

export function PublicBookingClient({ doctors }: PublicBookingClientProps) {
  const [successData, setSuccessData] = useState<{ mrn: string; date: string; time: string; doctorName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'prefer_not_to_say',
      appointmentType: 'new_patient',
    }
  });

  const selectedDoctorId = watch('providerId');

  const onSelectDoctor = (id: string) => {
    setValue('providerId', id);
    const formElement = document.getElementById('booking-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);

  const onSubmit = async (data: BookingFormData) => {
    // Save pending booking details and display the sign-up requirement notification
    setPendingBookingData(data);
    const promptElement = document.getElementById('booking-section');
    if (promptElement) {
      promptElement.scrollIntoView({ behavior: 'smooth' });
    }
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

  if (pendingBookingData) {
    const doctor = doctors.find(d => d.id === pendingBookingData.providerId);
    const doctorName = doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Selected Provider';
    const timeLabel = TIME_SLOTS.find(t => t.value === pendingBookingData.time)?.label ?? pendingBookingData.time;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-scale-up" id="booking-section">
        <Card className="border-amber-500/20 bg-amber-500/5 p-8 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6 text-amber-400">
            <User className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-[hsl(var(--foreground))] mb-2">Patient Account Required</h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-6">
            To finalise and submit your appointment, you must first register for a secure Patient Portal account. Your booking details will be saved and finalised immediately upon sign-up.
          </p>

          {/* Booking Summary */}
          <div className="border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--surface))] overflow-hidden max-w-md mx-auto mb-8 divide-y divide-[hsl(var(--border-muted))]">
            <div className="p-4 bg-amber-500/5">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold">Appointment Summary</p>
              <p className="text-lg font-bold text-[hsl(var(--foreground))] mt-1">{doctorName}</p>
              <p className="text-xs text-amber-500 mt-0.5">{pendingBookingData.appointmentType.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-left text-xs font-medium">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-normal">Date</p>
                <p className="font-semibold text-[hsl(var(--foreground))] mt-0.5">{pendingBookingData.date}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-normal">Time</p>
                <p className="font-semibold text-[hsl(var(--foreground))] mt-0.5">{timeLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="secondary" onClick={() => setPendingBookingData(null)}>
              Modify Appointment Details
            </Button>
            <Button variant="primary" onClick={handleRedirectToSignup} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Create Account & Finalize Booking <ChevronRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-scale-up">
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-8 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl" />
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6 text-emerald-400">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-3xl font-extrabold text-[hsl(var(--foreground))] mb-2">Appointment Scheduled!</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-6">
            Your appointment has been registered successfully in our system. You do not need to register an account to visit.
          </p>

          <div className="border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--surface))] overflow-hidden max-w-md mx-auto mb-8 divide-y divide-[hsl(var(--border-muted))]">
            <div className="p-4 bg-blue-500/5">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold">Your Medical Record Number (MRN)</p>
              <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 select-all">{successData.mrn}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">Please keep this MRN for your reference during check-in.</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-left text-sm">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Doctor</p>
                <p className="font-semibold text-[hsl(var(--foreground))] mt-0.5">{successData.doctorName}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Date & Time</p>
                <p className="font-semibold text-[hsl(var(--foreground))] mt-0.5">{successData.date} at {successData.time}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="secondary" onClick={() => setSuccessData(null)}>
              Book Another Appointment
            </Button>
            <Link href="/login">
              <Button variant="primary">
                Go to Portal Login <ChevronRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-16 py-8">
      {/* Doctors Grid Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))]">Meet Our Specialized Doctors</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Select a specialist from our care team to schedule your visit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Card key={doc.id} className="flex flex-col h-full hover:border-blue-500/30 transition-all border-[hsl(var(--border))]">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative rounded-2xl overflow-hidden w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30 shadow-glow">
                    {doc.avatar_url ? (
                      <img src={doc.avatar_url} alt={`${doc.first_name} ${doc.last_name}`} className="object-cover w-full h-full" />
                    ) : (
                      <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Dr. {doc.first_name} {doc.last_name}</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{doc.specialty || 'General Practitioner'}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{doc.department || 'Clinical Care'}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[hsl(var(--border-muted))] text-xs text-[hsl(var(--muted-foreground))] space-y-1.5">
                  <p>📍 Available for In-person & Telehealth</p>
                  <p>⏱️ Avg. appointment duration: 30 mins</p>
                </div>
              </div>
              <div className="p-4 bg-[hsl(var(--muted))]/10 border-t border-[hsl(var(--border-muted))]">
                <Button
                  variant={selectedDoctorId === doc.id ? 'secondary' : 'primary'}
                  className="w-full justify-center"
                  onClick={() => onSelectDoctor(doc.id)}
                >
                  {selectedDoctorId === doc.id ? 'Selected' : 'Book with Doctor'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Booking Form Section */}
      <section id="booking-section" className="max-w-3xl mx-auto scroll-mt-20">
        <Card className="border-[hsl(var(--border))]">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[hsl(var(--border-muted))]">
              <div className="rounded-xl p-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">Apply for Appointment</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">No account required. Fill in the details to schedule.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Personal Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
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

              {/* Appointment Scheduling Details */}
              <div className="space-y-4 pt-4 border-t border-[hsl(var(--border-muted))]">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" /> Visit Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Select Doctor"
                    options={[
                      { value: '', label: 'Select a physician...' },
                      ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.first_name} ${d.last_name} (${d.specialty || 'General Practitioner'})` }))
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
                    options={[{ value: '', label: 'Select slot...' }, ...TIME_SLOTS]}
                    error={errors.time?.message}
                    {...register('time')}
                  />
                </div>
                <Textarea
                  label="Reason for Visit (Chief Complaint)"
                  placeholder="Describe your symptoms or reason for visit (optional)"
                  error={errors.chiefComplaint?.message}
                  rows={3}
                  {...register('chiefComplaint')}
                />
              </div>

              {error && (
                <div className="alert-error">
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full justify-center text-sm py-2.5"
                variant="primary"
              >
                Schedule Appointment <ChevronRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}
