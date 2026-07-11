'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Input, Select, Button } from '@/components/ui';
import { ArrowLeft, User, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { adminUpdateUser } from '@/app/actions';
import type { Profile } from '@/lib/types/database';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'doctor', 'nurse', 'receptionist', 'patient']),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  department: z.string().optional(),
  npiNumber: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'patient', label: 'Patient' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active (Allowed Access)' },
  { value: 'false', label: 'Inactive / Banned (Access Blocked)' },
];

interface EditUserClientProps {
  profile: Profile;
}

export function EditUserClient({ profile }: EditUserClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      phone: profile.phone || '',
      specialty: profile.specialty || '',
      department: profile.department || '',
      npiNumber: profile.npi_number || '',
      isActive: profile.is_active,
    },
  });

  const selectedRole = watch('role');
  const isActive = watch('isActive');

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSuccess(false);

    const res = await adminUpdateUser(profile.id, data);
    if ('error' in res) {
      setError(res.error);
    } else {
      setSuccess(true);
      router.push('/admin/users');
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to users
        </Link>
      </div>

      <Card className="p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-[hsl(var(--border-muted))] pb-6">
          <div className="rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/20">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              Edit User: {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Modify user profile, update application roles, or manage system access.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            User account updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Read-only account identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[hsl(var(--surface-hover))] p-4 rounded-lg border border-[hsl(var(--border))]">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Primary Email</p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] mt-0.5">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Account Created</p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] mt-0.5">
                {new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          {/* Identity Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role"
              options={ROLE_OPTIONS}
              error={errors.role?.message}
              {...register('role')}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. 555-019-2834"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          {/* Account Status / Blocking */}
          <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] space-y-4">
            <div className="flex items-start gap-3">
              {isActive ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Account Status</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Setting this account to inactive will instantly ban/block the user. They will be kicked out of all active sessions and blocked from logging in.
                </p>
              </div>
            </div>

            <Select
              options={STATUS_OPTIONS}
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setValue('isActive', e.target.value === 'true')}
            />
          </div>

          {/* Department - visible for staff */}
          {selectedRole !== 'patient' && (
            <div className="pt-4 border-t border-[hsl(var(--border-muted))]">
              <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">
                Staff & Department Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Department / Unit"
                  placeholder="e.g. Pediatrics, Cardiology, Front Desk"
                  error={errors.department?.message}
                  {...register('department')}
                />
                
                {/* Specialty - for Doctor only */}
                {selectedRole === 'doctor' && (
                  <Input
                    label="Medical Specialty"
                    placeholder="e.g. Internal Medicine, Family Practice"
                    error={errors.specialty?.message}
                    {...register('specialty')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Clinical Credentials (NPI) - visible for doctor/nurse */}
          {(selectedRole === 'doctor' || selectedRole === 'nurse') && (
            <div className="pt-4 border-t border-[hsl(var(--border-muted))]">
              <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">
                Clinical Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="NPI Number (National Provider Identifier)"
                  placeholder="10-digit number"
                  maxLength={10}
                  error={errors.npiNumber?.message}
                  {...register('npiNumber')}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[hsl(var(--border-muted))]">
            <Link href="/admin/users" className="btn btn-secondary text-sm">
              Cancel
            </Link>
            <Button type="submit" loading={isSubmitting} variant="primary" className="text-sm">
              Save Profile Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
