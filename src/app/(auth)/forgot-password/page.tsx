'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: FormData) => {
    const supabase = createClient();

    // Always show success to prevent email enumeration attacks
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmittedEmail(email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
        <div className="relative z-10 max-w-md w-full text-center space-y-6 animate-slide-up bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-xl">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-[#0891B2]/10 border-2 border-[#0891B2]/30">
            <CheckCircle2 className="w-10 h-10 text-[#0891B2]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-cambria text-2xl font-bold text-[#0B2A55]">Check Your Email</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              If an account exists for{' '}
              <span className="font-bold text-[#0F172A]">{submittedEmail}</span>, you'll receive a
              password reset link shortly.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs leading-relaxed text-left">
            <p className="font-bold mb-1">Didn't receive it?</p>
            <ul className="space-y-1 list-disc list-inside text-amber-700">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E2E8F0] text-[#0B2A55] text-sm font-bold hover:bg-[#F1F5F9] transition-all"
            >
              Try a different email
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-sm text-[#0891B2] font-semibold hover:underline underline-offset-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full relative">
      {isSubmitting && <CustomLoader fullScreen={true} message="Sending reset link..." autoFade={false} />}

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
              Account Recovery
            </span>
            <h2 className="font-cambria text-4xl font-bold text-white leading-tight">
              Reset your<br />password securely.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Enter your registered email address and we'll send you a secure link to create a new password.
            </p>
          </div>

          <ul className="space-y-3.5">
            {[
              { icon: Mail, label: 'Secure link sent to your inbox' },
              { icon: ShieldCheck, label: 'Link expires after 1 hour' },
              { icon: CheckCircle2, label: 'Your records remain protected' },
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
            <h1 className="font-cambria text-2xl font-bold text-[#0B2A55]">Reset Your Password</h1>
            <p className="text-sm text-[#475569]">We'll email you a secure reset link</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block space-y-1.5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Account Recovery</span>
            <h2 className="font-cambria text-3xl font-bold text-[#0B2A55]">Forgot Password?</h2>
            <p className="text-sm text-[#475569]">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="forgot-email" className="text-xs font-semibold text-[#0F172A]">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={`input ${errors.email ? 'border-red-500/50 focus:ring-red-400' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="forgot-password-submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-sm font-bold tracking-wide hover:opacity-95 disabled:opacity-60 transition-all duration-200 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="pt-2 border-t border-[#E2E8F0] text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-sm text-[#0891B2] font-bold hover:underline underline-offset-2 mt-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<CustomLoader message="Loading..." />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
