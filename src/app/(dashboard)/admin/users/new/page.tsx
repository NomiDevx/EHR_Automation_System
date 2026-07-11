'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Input, Select, Button } from '@/components/ui';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { adminCreateUser } from '@/app/actions';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'doctor', 'nurse', 'receptionist', 'patient']),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  department: z.string().optional(),
  npiNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'patient', label: 'Patient' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'patient',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSuccess(false);

    const res = await adminCreateUser(data);
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
            <UserPlus className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Add New User Account</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Create login credentials and configure profile information.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Identity Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="e.g. John"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Doe"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john.doe@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              error={errors.password?.message}
              {...register('password')}
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

          {/* Department - visible for all staff roles */}
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
              Create User Account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
