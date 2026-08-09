'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { Eye, EyeOff, Lock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async ({ password }: FormData) => {
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Failed to update password. The reset link may have expired.');
      return;
    }

    // Sign out so the user logs in fresh with the new password
    await supabase.auth.signOut();
    setSuccess(true);

    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
        <div className="relative z-10 max-w-md w-full text-center space-y-6 animate-slide-up bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-xl">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-[#16A34A]/10 border-2 border-[#16A34A]/30">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
          </div>
          <div className="space-y-2">
            <h2 className="font-cambria text-2xl font-bold text-[#0B2A55]">Password Updated!</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Your password has been changed successfully. Redirecting you to the sign-in page…
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
      {isSubmitting && <CustomLoader fullScreen={true} message="Updating password..." autoFade={false} />}

      {/* ── Left Panel ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-14 bg-[#0B2A55] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-[#0891B2]/20 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-[#14B8A6]/20 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center bg-white border border-[#E2E8F0] p-3.5 rounded-2xl shadow-sm w-48 sm:w-60 h-16 sm:h-20">
            <Image src="/images/image.png" alt="MediSynx EHR Logo" width={240} height={80} className="object-contain w-full h-full p-0.5" priority />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="w-12 h-1 bg-gradient-to-r from-[#0891B2] via-[#14B8A6] to-[#4CAF50] rounded-full" />

          <div className="space-y-4">
            <span className="text-xs font-bold tracking-widest uppercase text-[#22D3EE] bg-[#0891B2]/20 px-3 py-1 rounded-full border border-[#0891B2]/30">
              Create New Password
            </span>
            <h2 className="font-cambria text-4xl font-bold text-white leading-tight">
              Choose a strong<br />new password.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Your new password must be at least 8 characters with an uppercase letter and a number.
            </p>
          </div>

          <ul className="space-y-3.5">
            {[
              { icon: Lock, label: 'Minimum 8 characters' },
              { icon: ShieldCheck, label: 'At least one uppercase letter' },
              { icon: CheckCircle2, label: 'At least one number' },
            ].map(({ icon: Icon, label }) => (
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
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} MediSynx EHR · Smart Records. Better Care.</p>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F8FAFC] relative">
        <div className="relative z-10 w-full max-w-[420px] animate-slide-up space-y-8">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center space-y-3">
            <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-sm mb-1 w-44 h-14">
              <Image src="/images/image.png" alt="MediSynx EHR Logo" width={180} height={60} className="object-contain w-full h-full" />
            </div>
            <h1 className="font-cambria text-2xl font-bold text-[#0B2A55]">Create New Password</h1>
            <p className="text-sm text-[#475569]">Enter and confirm your new password below</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block space-y-1.5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Account Recovery</span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">Set New Password</h2>
            <p className="text-sm text-[#475569]">Choose a secure password for your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-password" className="text-xs font-semibold text-[#0F172A]">New Password</label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.password ? 'border-red-500/50 focus:ring-red-400' : ''}`}
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

              {/* Strength bar */}
              {passwordValue.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[8, 12, 16].map((threshold, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        passwordValue.length >= threshold
                          ? i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-400' : 'bg-emerald-500'
                          : 'bg-[#E2E8F0]'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-[#94A3B8] ml-1 self-center whitespace-nowrap">
                    {passwordValue.length < 8 ? 'Too short' : passwordValue.length < 12 ? 'Fair' : passwordValue.length < 16 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-confirm-password" className="text-xs font-semibold text-[#0F172A]">Confirm Password</label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.confirmPassword ? 'border-red-500/50 focus:ring-red-400' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              id="reset-password-submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-sm font-bold tracking-wide hover:opacity-95 disabled:opacity-60 transition-all duration-200 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Updating…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Update Password
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#E2E8F0] text-center">
            <p className="text-sm text-[#475569] mt-4">
              Remembered your password?{' '}
              <Link href="/login" className="text-[#0891B2] font-bold hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<CustomLoader message="Loading..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
