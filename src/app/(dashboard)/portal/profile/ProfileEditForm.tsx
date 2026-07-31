'use client';

import { useState, useTransition } from 'react';
import { Save, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { updatePatientProfile } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface ProfileEditFormProps {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
}

export function ProfileEditForm({ firstName, lastName, dateOfBirth }: ProfileEditFormProps) {
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [dob, setDob] = useState(dateOfBirth); // kept as YYYY-MM-DD for <input type="date">
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isDirty =
    first.trim() !== firstName ||
    last.trim() !== lastName ||
    dob !== dateOfBirth;

  const handleReset = () => {
    setFirst(firstName);
    setLast(lastName);
    setDob(dateOfBirth);
    setStatus('idle');
    setMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (!first.trim() || !last.trim()) {
      setStatus('error');
      setMessage('First name and last name cannot be empty.');
      return;
    }

    startTransition(async () => {
      const result = await updatePatientProfile({
        firstName: first.trim(),
        lastName: last.trim(),
        dateOfBirth: dob,
      });

      if ('error' in result) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Profile updated successfully!');
        // Refresh server component data (re-fetches patient record)
        router.refresh();
      }
    });
  };

  const inputBase =
    'w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/40 focus:border-[hsl(var(--primary))]/60 transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="profile-edit-form">
      {/* First name */}
      <div className="space-y-1.5">
        <label
          htmlFor="profile-first-name"
          className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide"
        >
          First Name
        </label>
        <input
          id="profile-first-name"
          type="text"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="First name"
          className={inputBase}
          required
          autoComplete="given-name"
        />
      </div>

      {/* Last name */}
      <div className="space-y-1.5">
        <label
          htmlFor="profile-last-name"
          className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide"
        >
          Last Name
        </label>
        <input
          id="profile-last-name"
          type="text"
          value={last}
          onChange={(e) => setLast(e.target.value)}
          placeholder="Last name"
          className={inputBase}
          required
          autoComplete="family-name"
        />
      </div>

      {/* Date of birth */}
      <div className="space-y-1.5">
        <label
          htmlFor="profile-dob"
          className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide"
        >
          Date of Birth
        </label>
        <input
          id="profile-dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className={inputBase}
          required
          max={new Date().toISOString().split('T')[0]}
        />
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

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          id="profile-save-btn"
          type="submit"
          disabled={isPending || !isDirty}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:bg-[hsl(220,55%,28%)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </>
          )}
        </button>

        {isDirty && (
          <button
            id="profile-reset-btn"
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
