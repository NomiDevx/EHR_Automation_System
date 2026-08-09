'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Activity, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types/database';
import { bookPublicAppointment } from '@/app/actions';

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/clinical/patients',
  nurse: '/clinical/patients',
  receptionist: '/reception',
  patient: '/portal',
};

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'End-to-end encrypted records' },
  { icon: Users, label: '15,000+ patients served' },
  { icon: Activity, label: 'Real-time clinical updates' },
  { icon: Award, label: 'Board-certified clinicians' },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const supabase = createClient();

  const getSignupUrl = () => {
    const isBookingRedirect = params.get('booking') === 'true';
    if (!isBookingRedirect) return '/signup';
    return `/signup?${params.toString()}`;
  };

  const reason = params.get('reason');
  const reasonMsg: Record<string, string> = {
    timeout: 'Your session expired due to inactivity.',
    inactive: 'Your account has been deactivated. Contact an administrator.',
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = ((profile as any)?.role as UserRole) ?? 'patient';

    // Fire login notification email in the background — non-blocking
    fetch('/api/notifications/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginTime: new Date().toISOString() }),
    }).catch(() => void 0);

    const isBookingRedirect = params.get('booking') === 'true';
    if (isBookingRedirect) {
      const bookingFirstName = params.get('firstName') || '';
      const bookingLastName = params.get('lastName') || '';
      const bookingEmail = params.get('email') || '';
      const bookingDoctorId = params.get('providerId') || '';
      const bookingType = params.get('appointmentType') || '';
      const bookingDate = params.get('date') || '';
      const bookingTime = params.get('time') || '';
      const bookingComplaint = params.get('chiefComplaint') || '';
      const bookingDob = params.get('dob') || '';
      const bookingGender = params.get('gender') || '';
      const bookingPhone = params.get('phone') || '';

      try {
        const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
        await bookPublicAppointment({
          firstName: bookingFirstName || user.user_metadata?.first_name || '',
          lastName: bookingLastName || user.user_metadata?.last_name || '',
          email: user.email || bookingEmail,
          phone: bookingPhone,
          dateOfBirth: bookingDob,
          gender: bookingGender as any,
          providerId: bookingDoctorId,
          appointmentType: bookingType as any,
          scheduledAt,
          chiefComplaint: bookingComplaint,
        });
      } catch (bookErr: any) {
        console.error('Failed to auto-finalize booking from login:', bookErr.message);
      }
    }

    const nextParam = params.get('next');
    let targetUrl = ROLE_HOME[role];

    if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.startsWith('\\')) {
      const routeRoles: [string, UserRole[]][] = [
        ['/admin', ['admin']],
        ['/clinical', ['admin', 'doctor', 'nurse']],
        ['/reception', ['admin', 'receptionist']],
        ['/portal', ['patient']],
        ['/schedule', ['admin', 'doctor', 'nurse', 'receptionist']],
      ];

      let isAllowed = true;
      for (const [prefix, allowedRoles] of routeRoles) {
        if (nextParam.startsWith(prefix)) {
          if (!allowedRoles.includes(role)) {
            isAllowed = false;
          }
          break;
        }
      }

      if (isAllowed) {
        targetUrl = nextParam;
      }
    }

    setIsNavigating(true);
    router.push(isBookingRedirect ? '/portal?booking_success=true' : targetUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex w-full relative">
      {/* Custom Auth Loading Spinner */}
      {isSubmitting && <CustomLoader fullScreen={true} message="Authenticating..." autoFade={false} />}

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

        {/* Center Editorial Block */}
        <div className="relative z-10 space-y-8">
          <div className="w-12 h-1 bg-gradient-to-r from-[#0891B2] via-[#14B8A6] to-[#4CAF50] rounded-full" />

          <div className="space-y-4">
            <span className="text-xs font-bold tracking-widest uppercase text-[#22D3EE] bg-[#0891B2]/20 px-3 py-1 rounded-full border border-[#0891B2]/30">
              Secure Patient Portal
            </span>
            <h2 className="font-cambria text-4xl font-bold text-white leading-tight">
              Your health,<br />always within reach.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Access appointments, clinical records, lab results, prescriptions, and secure messages with your care team — all in one place.
            </p>
          </div>

          {/* Trust points */}
          <ul className="space-y-3.5">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0891B2]/20 border border-[#0891B2]/30 shrink-0">
                  <Icon className="w-4 h-4 text-[#22D3EE]" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Tagline Footer */}
        <div className="relative z-10">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MediSynx EHR · Smart Records. Better Care.
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F8FAFC] relative">
        <div className="relative z-10 w-full max-w-[420px] animate-slide-up space-y-8">

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
              Sign In to MediSynx EHR
            </h1>
            <p className="text-sm text-[#475569]">Access your patient dashboard</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block space-y-1.5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">
              Welcome Back
            </span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">Sign In</h2>
            <p className="text-sm text-[#475569]">
              Access your patient dashboard and clinical records.
            </p>
          </div>

          {/* Session alerts */}
          {reason && reasonMsg[reason] && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{reasonMsg[reason]}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              id="login-email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-[#0F172A]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#0891B2] font-semibold hover:underline underline-offset-2 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'input pr-10',
                    errors.password && 'border-red-500/50 focus:ring-red-400'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isNavigating}
              id="login-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-sm font-bold tracking-wide hover:opacity-95 disabled:opacity-60 transition-all duration-200 shadow-md"
            >
              {isSubmitting || isNavigating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isNavigating ? 'Redirecting…' : 'Signing in…'}
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create account link */}
          <div className="pt-2 border-t border-[#E2E8F0] text-center">
            <p className="text-sm text-[#475569] mt-4">
              New patient?{' '}
              <Link
                href={getSignupUrl()}
                className="text-[#0891B2] font-bold hover:underline underline-offset-2 transition-colors"
              >
                Create a portal account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<CustomLoader message="Preparing login..." />}>
      <LoginForm />
    </Suspense>
  );
}
