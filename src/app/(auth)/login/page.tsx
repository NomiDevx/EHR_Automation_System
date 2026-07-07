'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Input, Button, ParticlesBg } from '@/components/ui';
import { HeartPulse, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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

    // Fetch role and redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = ((profile as any)?.role as UserRole) ?? 'patient';
    router.push(ROLE_HOME[role]);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex w-full relative">
      {/* Left visual showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-slate-950 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-900">
        {/* Glow effect and Particle Network */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-emerald-950/10 z-0" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] z-0" />
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
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur-lg opacity-25" />
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-glow-blue">
              {/* Fake Window Controls */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <div className="text-[10px] text-slate-500 font-medium ml-4">MediCore EHR Portal v2.4.0</div>
              </div>
              {/* Dashboard Preview Image */}
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
          <p className="text-blue-400 font-semibold text-sm tracking-wide uppercase">Next-Gen Patient Portal</p>
          <h2 className="text-2xl font-bold text-white mt-1 leading-snug">Secure. Integrated. Real-time care.</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Manage appointments, view detailed lab results instantly, keep track of prescriptions, and communicate securely with your providers.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col justify-center items-center p-6 md:p-12 relative min-h-screen bg-[hsl(var(--background))]">
        {/* Particle Bg for mobile */}
        <div className="block lg:hidden absolute inset-0 z-0">
          <ParticlesBg />
        </div>
        
        {/* Soft background blobs on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] dark:bg-blue-600/5" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-800/10 rounded-full blur-[100px] dark:bg-blue-800/5" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-slide-up">
          {/* Logo only on mobile */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3 shadow-glow">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">MediCore EHR</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Sign in to your portal account</p>
          </div>

          {/* Form Card */}
          <div className="card bg-[hsl(var(--surface))]/80 backdrop-blur-md border border-[hsl(var(--border))]/75 shadow-lg p-6 md:p-8 rounded-2xl">
            <h2 className="hidden lg:block text-2xl font-bold text-[hsl(var(--foreground))] mb-2">Welcome Back</h2>
            <p className="hidden lg:block text-sm text-[hsl(var(--muted-foreground))] mb-6">Sign in to access your dashboard</p>

            {/* Alert banners */}
            {reason && reasonMsg[reason] && (
              <div className="alert-warning mb-4">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{reasonMsg[reason]}</span>
              </div>
            )}

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
                  <label htmlFor="login-password" className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn('input pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent', errors.password && 'border-red-500/50')}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    id="toggle-password-btn"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="alert-error">
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10"
                id="login-submit-btn"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-[hsl(var(--border))] text-center">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                New patient?{' '}
                <Link href="/signup" className="text-blue-500 hover:text-blue-400 hover:underline font-medium transition-colors">
                  Create a portal account
                </Link>
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-6 opacity-60">
            ⚠️ Demo/Portfolio project — not a certified HIPAA system
          </p>
        </div>
      </div>
    </div>
  );
}
