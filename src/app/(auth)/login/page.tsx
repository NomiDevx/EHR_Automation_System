'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Input, Button } from '@/components/ui';
import { Cross, Eye, EyeOff, ShieldCheck, ArrowRight, Activity, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types/database';

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
  { icon: Users,       label: '12,000+ patients served' },
  { icon: Activity,    label: 'Real-time clinical updates' },
  { icon: Award,       label: 'Board-certified clinicians' },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
    
    // Redirect handling with next query param validation (Open Redirect protection)
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

    router.push(targetUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex w-full">

      {/* ── Left Panel — deep navy, editorial ───────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'hsl(220,45%,11%)' }}
      >
        {/* Subtle radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[hsl(43,62%,48%)]/6 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(215,75%,55%)]/8 blur-[100px]" />
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

        {/* Center editorial block */}
        <div className="relative z-10 space-y-8">
          {/* Gold accent line */}
          <div className="w-10 h-px bg-[hsl(43,62%,48%)]" />

          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(43,62%,55%)]">
              Secure Patient Portal
            </p>
            <h2 className="font-display text-4xl font-600 text-white leading-tight">
              Your health,<br />always within reach.
            </h2>
            <p className="text-sm text-[hsl(215,20%,60%)] leading-relaxed max-w-sm">
              Access appointments, clinical records, lab results, prescriptions, and secure messages with your care team — all in one place.
            </p>
          </div>

          {/* Trust points */}
          <ul className="space-y-3">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-[hsl(215,15%,65%)]">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[hsl(43,62%,48%)]/10 border border-[hsl(43,62%,48%)]/20 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[hsl(43,62%,55%)]" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-xs text-[hsl(215,15%,40%)]">
            © {new Date().getFullYear()} MediCore Healthcare · Demo Portfolio
          </p>
        </div>
      </div>

      {/* ── Right Panel — form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[hsl(var(--background))] relative">
        {/* Soft background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-[hsl(var(--primary))]/5 blur-[120px]" />
          <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-[hsl(var(--accent))]/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[420px] animate-slide-up space-y-8">

          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(var(--primary))] mb-1">
              <Cross className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[hsl(var(--foreground))]">
              Medi<span className="text-[hsl(var(--accent))]">Core</span> EHR
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Sign in to your portal account</p>
          </div>

          {/* Heading */}
          <div className="hidden lg:block space-y-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Welcome Back</p>
            <h2 className="font-display text-3xl font-600 text-[hsl(var(--foreground))]">Sign In</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] pt-1">
              Access your patient dashboard and clinical records.
            </p>
          </div>

          {/* Session alerts */}
          {reason && reasonMsg[reason] && (
            <div className="alert-warning text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
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
              <label htmlFor="login-password" className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Password
              </label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  id="toggle-password-btn"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="alert-error text-sm">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              id="login-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold tracking-wide hover:bg-[hsl(220,55%,28%)] disabled:opacity-60 transition-all duration-200 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider + link */}
          <div className="pt-1 border-t border-[hsl(var(--border))] text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-5">
              New patient?{' '}
              <Link
                href="/signup"
                className="text-[hsl(var(--accent))] font-semibold hover:underline underline-offset-2 transition-colors"
              >
                Create a portal account
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,45%,11%)] text-white font-display text-xl">
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
