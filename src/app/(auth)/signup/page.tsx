'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { signUpPatient, bookPublicAppointment } from '@/app/actions';
import { Input } from '@/components/ui';
import {
  Cross, ArrowRight, ShieldCheck, CalendarDays,
  FileText, MessageSquare,
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
      // Step 1: Create user server-side with email_confirm: true (no email verification)
      const result = await signUpPatient(email, password, firstName, lastName, dateOfBirth);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      // Step 2: Immediately sign in — user is already confirmed, no email needed
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Account was created but auto-login failed — show success + redirect to login
        setSuccess(true);
        return;
      }

      // Step 3: Handle booking redirect (portal-linked appointment)
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

      // Step 4: Redirect to portal dashboard with booking success indicator if applicable
      router.push(isBookingRedirect ? '/portal?booking_success=true' : '/portal');
      router.refresh();
    } catch (err: any) {
      console.error('[Signup] Unexpected error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    }
  };


  // ─── Success Screen ──────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-6">
        <div className="relative z-10 max-w-md w-full text-center space-y-6 animate-slide-up">
          {/* Animated check ring */}
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
            <svg className="w-9 h-9 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-3xl font-600 text-[hsl(var(--foreground))]">
              Account Created!
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              Your patient portal account is ready. Sign in below to access your dashboard.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(220,55%,28%)] transition-all"
          >
            Back to Sign In <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-50">
            ⚠️ Demo / Portfolio — not a certified HIPAA system
          </p>
        </div>
      </div>
    );
  }

  // ─── Signup Form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex w-full">

      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'hsl(220,45%,11%)' }}
      >
        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[450px] h-[450px] rounded-full bg-[hsl(43,62%,48%)]/6 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-[hsl(215,75%,55%)]/8 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(43,62%,48%)]/15 border border-[hsl(43,62%,48%)]/30">
            <Cross className="w-5 h-5 text-[hsl(43,62%,65%)] fill-[hsl(43,62%,65%)]" />
          </div>
          <span className="font-display text-xl font-semibold text-white tracking-wide">
            Medi<span className="text-[hsl(43,62%,60%)]">Core</span>
          </span>
        </div>

        {/* Editorial content */}
        <div className="relative z-10 space-y-8">
          <div className="w-10 h-px bg-[hsl(43,62%,48%)]" />

          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(43,62%,55%)]">
              Patient Portal
            </p>
            <h2 className="font-display text-4xl font-600 text-white leading-tight">
              Your health records,<br />instantly accessible.
            </h2>
            <p className="text-sm text-[hsl(215,20%,60%)] leading-relaxed max-w-sm">
              Create a free account to unlock your complete health dashboard — view records, manage appointments, and connect with clinical staff.
            </p>
          </div>

          {/* Portal perks */}
          <ul className="space-y-3">
            {PORTAL_PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-[hsl(215,15%,65%)]">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[hsl(43,62%,48%)]/10 border border-[hsl(43,62%,48%)]/20 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[hsl(43,62%,55%)]" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-[hsl(215,15%,40%)]">
            © {new Date().getFullYear()} MediCore Healthcare · Demo Portfolio
          </p>
        </div>
      </div>

      {/* ── Right Panel — form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[hsl(var(--background))] relative overflow-y-auto">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-[hsl(var(--primary))]/5 blur-[120px]" />
          <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-[hsl(var(--accent))]/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[440px] animate-slide-up space-y-8">

          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(var(--primary))] mb-1">
              <Cross className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[hsl(var(--foreground))]">
              Medi<span className="text-[hsl(var(--accent))]">Core</span> EHR
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Register for your patient portal</p>
          </div>

          {/* Heading */}
          <div className="hidden lg:block space-y-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Get Started</p>
            <h2 className="font-display text-3xl font-600 text-[hsl(var(--foreground))]">Create Account</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] pt-1">
              Register to explore your personal health dashboard.
            </p>
          </div>

          {/* Booking redirect notice */}
          {isBookingRedirect && (
            <div className="alert-info text-sm">
              <span>🏥 Complete your registration below to confirm your appointment reservation.</span>
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
              <div className="alert-error text-sm">
                <span>{typeof error === 'string' ? error : 'An unexpected error occurred. Please try again.'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              id="signup-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold tracking-wide hover:bg-[hsl(220,55%,28%)] disabled:opacity-60 transition-all duration-200 shadow-md mt-1"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  {isBookingRedirect ? 'Create Account & Book' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="pt-1 border-t border-[hsl(var(--border))] text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-5">
              Already have an account?{' '}
              <Link
                href={getLoginUrl()}
                className="text-[hsl(var(--accent))] font-semibold hover:underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] opacity-50">
            ⚠️ Demo / Portfolio — not a certified HIPAA system
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,45%,11%)] text-white font-display text-xl">
        Loading…
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
