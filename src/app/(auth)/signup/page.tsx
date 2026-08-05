'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { signUpPatient, bookPublicAppointment } from '@/app/actions';
import { Input } from '@/components/ui';
import { CustomLoader } from '@/components/ui/CustomLoader';
import {
  ArrowRight, ShieldCheck, CalendarDays,
  FileText, MessageSquare, CheckCircle2
} from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

const PORTAL_PERKS = [
  { icon: CalendarDays, label: 'View & manage appointments online' },
  { icon: FileText, label: 'Instant access to lab results & charts' },
  { icon: ShieldCheck, label: 'Encrypted health record storage' },
  { icon: MessageSquare, label: 'Secure messaging with your care team' },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const isBookingRedirect = searchParams.get('booking') === 'true';
  const bookingDoctorId = searchParams.get('providerId') || '';
  const bookingType = searchParams.get('appointmentType') || '';
  const bookingDate = searchParams.get('date') || '';
  const bookingTime = searchParams.get('time') || '';
  const bookingComplaint = searchParams.get('chiefComplaint') || '';
  const bookingDob = searchParams.get('dob') || '';
  const bookingGender = searchParams.get('gender') || '';
  const bookingPhone = searchParams.get('phone') || '';

  const getLoginUrl = () => {
    if (!isBookingRedirect) return '/login';
    return `/login?${searchParams.toString()}`;
  };

  const defaultFirstName = searchParams.get('firstName') || '';
  const defaultLastName = searchParams.get('lastName') || '';
  const defaultEmail = searchParams.get('email') || '';
  const defaultDob = searchParams.get('dob') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      email: defaultEmail,
      dateOfBirth: defaultDob,
    },
  });

  const onSubmit = async ({ email, password, firstName, lastName, dateOfBirth }: FormData) => {
    setError(null);
    try {
      const result = await signUpPatient(email, password, firstName, lastName, dateOfBirth);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setSuccess(true);
        return;
      }

      if (isBookingRedirect) {
        try {
          const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
          await bookPublicAppointment({
            firstName, lastName, email,
            phone: bookingPhone,
            dateOfBirth: dateOfBirth || bookingDob,
            gender: bookingGender as any,
            providerId: bookingDoctorId,
            appointmentType: bookingType as any,
            scheduledAt,
            chiefComplaint: bookingComplaint,
          });
        } catch (bookErr: any) {
          console.error('Failed to auto-finalize booking:', bookErr.message);
        }
      }

      router.push(isBookingRedirect ? '/portal?booking_success=true' : '/portal');
      router.refresh();
    } catch (err: any) {
      console.error('[Signup] Unexpected error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
        <div className="relative z-10 max-w-md w-full text-center space-y-6 animate-slide-up bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-xl">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-[#16A34A]/10 border-2 border-[#16A34A]/30">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">
              Account Created!
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Your MediSynx patient portal account is ready. Sign in below to access your dashboard.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0891B2] text-white text-sm font-bold hover:bg-[#0F766E] transition-all shadow-md"
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full relative">
      {/* Custom Auth Loading Spinner */}
      {isSubmitting && <CustomLoader fullScreen={true} message="Creating Portal Account..." />}

      {/* ── Left Panel — Navy (#0B2A55) Brand Sidebar ──────────── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-14 bg-[#0B2A55] text-white relative overflow-hidden">
        {/* Cyan & Teal Background Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-[#0891B2]/20 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-[#14B8A6]/20 blur-[100px]" />
        </div>

        {/* Prominent Large Logo Box */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center bg-white border border-[#E2E8F0] p-3.5 rounded-2xl shadow-sm w-48 sm:w-60 h-16 sm:h-20">
            <Image
              src="/images/image.png"
              alt="MediSynx EHR Logo"
              width={240}
              height={80}
              className="object-contain w-full h-full p-0.5"
              priority
            />
          </Link>
        </div>

        {/* Editorial content */}
        <div className="relative z-10 space-y-8">
          <div className="w-12 h-1 bg-gradient-to-r from-[#0891B2] via-[#14B8A6] to-[#4CAF50] rounded-full" />

          <div className="space-y-4">
            <span className="text-xs font-bold tracking-widest uppercase text-[#22D3EE] bg-[#0891B2]/20 px-3 py-1 rounded-full border border-[#0891B2]/30">
              Patient Portal
            </span>
            <h2 className="font-cambria text-4xl font-bold text-white leading-tight">
              Your health records,<br />instantly accessible.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Create a free account to unlock your complete health dashboard — view records, manage appointments, and connect with clinical staff.
            </p>
          </div>

          {/* Portal perks */}
          <ul className="space-y-3.5">
            {PORTAL_PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0891B2]/20 border border-[#0891B2]/30 shrink-0">
                  <Icon className="w-4 h-4 text-[#22D3EE]" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MediSynx EHR · Smart Records. Better Care.
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F8FAFC] relative overflow-y-auto">
        <div className="relative z-10 w-full max-w-[440px] animate-slide-up space-y-8">

          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center space-y-3">
            <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-sm mb-1 w-44 h-14">
              <Image
                src="/images/image.png"
                alt="MediSynx EHR Logo"
                width={180}
                height={60}
                className="object-contain w-full h-full"
              />
            </div>
            <h1 className="font-cambria text-2xl font-bold text-[#0B2A55]">
              MediSynx Patient Registration
            </h1>
            <p className="text-sm text-[#475569]">Register for your patient portal</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block space-y-1.5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">
              Get Started
            </span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">Create Account</h2>
            <p className="text-sm text-[#475569]">
              Register to explore your personal health dashboard.
            </p>
          </div>

          {/* Booking redirect notice */}
          {isBookingRedirect && (
            <div className="p-3.5 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] text-xs font-bold">
              🏥 Complete your registration below to confirm your appointment reservation.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" id="signup-first-name" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last Name" id="signup-last-name" error={errors.lastName?.message}  {...register('lastName')} />
            </div>

            <Input
              label="Date of Birth"
              type="date"
              id="signup-dob"
              max={new Date().toISOString().split('T')[0]}
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />

            <Input
              label="Email address"
              type="email"
              id="signup-email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              id="signup-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              id="signup-confirm-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
                <span>{typeof error === 'string' ? error : 'An unexpected error occurred. Please try again.'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              id="signup-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-sm font-bold tracking-wide hover:opacity-95 disabled:opacity-60 transition-all duration-200 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating Account…
                </>
              ) : (
                <>
                  {isBookingRedirect ? 'Create Account & Book' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="pt-2 border-t border-[#E2E8F0] text-center">
            <p className="text-sm text-[#475569] mt-4">
              Already have an account?{' '}
              <Link
                href={getLoginUrl()}
                className="text-[#0891B2] font-bold hover:underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<CustomLoader message="Preparing registration..." />}>
      <SignupForm />
    </Suspense>
  );
}
