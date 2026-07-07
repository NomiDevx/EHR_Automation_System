'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { bookPublicAppointment } from '@/app/actions';
import { Input, Button, ParticlesBg } from '@/components/ui';
import { HeartPulse } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

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

  const defaultFirstName = searchParams.get('firstName') || '';
  const defaultLastName = searchParams.get('lastName') || '';
  const defaultEmail = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      email: defaultEmail,
    }
  });

  const onSubmit = async ({ email, password, firstName, lastName }: FormData) => {
    setError(null);
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, role: 'patient' },
      },
    });
    if (authError) {
      setError(authError.message);
      return;
    }

    // Auto-finalize pending booking details
    if (isBookingRedirect && signUpData?.user) {
      try {
        const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
        await bookPublicAppointment({
          firstName,
          lastName,
          email,
          phone: bookingPhone,
          dateOfBirth: bookingDob,
          gender: bookingGender as any,
          providerId: bookingDoctorId,
          appointmentType: bookingType as any,
          scheduledAt,
          chiefComplaint: bookingComplaint,
        });
      } catch (bookErr: any) {
        console.error('Failed to auto-finalize appointment booking:', bookErr.message);
      }
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex w-full relative">
      {/* Left visual showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-slate-950 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-teal-950/10 z-0" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] z-0" />
        <ParticlesBg />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shadow-glow">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">MediCore EHR</span>
        </div>

        {/* Center Mockup Visualization */}
        <div className="relative z-10 flex items-center justify-center py-8">
          <div className="relative w-full max-w-[480px] animate-float">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl blur-lg opacity-25" />
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-glow-blue">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <div className="text-[10px] text-slate-500 font-medium ml-4">MediCore EHR Portal v2.4.0</div>
              </div>
              <div className="p-1.5 bg-slate-900">
                <img
                  src="/images/medical_dashboard_preview.png"
                  alt="MediCore Dashboard Preview"
                  className="rounded-lg border border-slate-800 w-full object-cover shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10">
          <p className="text-teal-400 font-semibold text-sm tracking-wide uppercase">Patient Empowerment</p>
          <h2 className="text-2xl font-bold text-white mt-1 leading-snug">Access your health records instantly.</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Create an account to securely view medical histories, request prescription refills, schedule appointments, and coordinate with care teams.
          </p>
        </div>
      </div>

      {/* Right side content */}
      <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col justify-center items-center p-6 md:p-12 relative min-h-screen bg-[hsl(var(--background))]">
        <div className="block lg:hidden absolute inset-0 z-0">
          <ParticlesBg />
        </div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] dark:bg-blue-600/5" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-800/10 rounded-full blur-[100px] dark:bg-teal-800/5" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-slide-up">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3 shadow-glow">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">MediCore EHR</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Access your health records online</p>
          </div>

          {success ? (
            <div className="card bg-[hsl(var(--surface))]/80 backdrop-blur-md border border-[hsl(var(--border))]/75 shadow-lg p-6 md:p-8 rounded-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500/30 mb-4 animate-bounce">
                <HeartPulse className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
                {isBookingRedirect ? 'Account Created & Appointment Saved!' : 'Check your email'}
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
                {isBookingRedirect
                  ? 'Your Patient Portal account has been registered and your appointment is scheduled. Please click the confirmation link sent to your email to activate your account.'
                  : 'We sent a confirmation link to your email. Click it to activate your patient portal account.'}
              </p>
              <Link href="/login" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 btn justify-center">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <div className="card bg-[hsl(var(--surface))]/80 backdrop-blur-md border border-[hsl(var(--border))]/75 shadow-lg p-6 md:p-8 rounded-2xl">
              {isBookingRedirect && (
                <div className="mb-4 alert alert-info text-xs">
                  <span>🏥 Complete your registration below to submit your appointment reservation.</span>
                </div>
              )}
              <h2 className="hidden lg:block text-2xl font-bold text-[hsl(var(--foreground))] mb-2">Create Patient Account</h2>
              <p className="hidden lg:block text-sm text-[hsl(var(--muted-foreground))] mb-6">Register to explore your medical dashboard</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" id="signup-first-name" error={errors.firstName?.message} {...register('firstName')} />
                  <Input label="Last Name" id="signup-last-name" error={errors.lastName?.message} {...register('lastName')} />
                </div>
                
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
                  <div className="alert-error">
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 mt-2"
                  id="signup-submit-btn"
                >
                  Create Account & Book
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-[hsl(var(--border))] text-center">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-500 hover:text-blue-400 hover:underline font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-6 opacity-60">
            ⚠️ Demo/Portfolio project — not a certified HIPAA system
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
