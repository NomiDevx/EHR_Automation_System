'use client';

import { useState, useTransition } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { changePassword } from '@/app/actions';

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await changePassword(newPassword);
      if ('error' in result) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const inputBase =
    'w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/40 focus:border-[hsl(var(--primary))]/60 transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-3" id="change-password-form">
      {/* New password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
          New Password
        </label>
        <div className="relative">
          <input
            id="new-password-input"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className={`${inputBase} pr-10`}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Toggle new password visibility"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {/* Strength bar */}
        {newPassword.length > 0 && (
          <div className="flex gap-1 mt-1">
            {[8, 12, 16].map((threshold, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  newPassword.length >= threshold
                    ? i === 0
                      ? 'bg-red-500'
                      : i === 1
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                    : 'bg-[hsl(var(--border))]'
                }`}
              />
            ))}
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-1 self-center whitespace-nowrap">
              {newPassword.length < 8 ? 'Too short' : newPassword.length < 12 ? 'Fair' : newPassword.length < 16 ? 'Good' : 'Strong'}
            </span>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirm-password-input"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className={`${inputBase} pr-10 ${
              confirmPassword && confirmPassword !== newPassword
                ? 'border-red-500/60 focus:ring-red-500/30'
                : confirmPassword && confirmPassword === newPassword
                ? 'border-emerald-500/60 focus:ring-emerald-500/30'
                : ''
            }`}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Toggle confirm password visibility"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Status message */}
      {status !== 'idle' && (
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium animate-fade-in ${
            status === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          {message}
        </div>
      )}

      {/* Submit */}
      <button
        id="change-password-submit"
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:bg-[hsl(220,55%,28%)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Updating…
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            Update Password
          </>
        )}
      </button>
    </form>
  );
}
