import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { UserCircle, ShieldCheck, CalendarDays, Mail, Phone, CreditCard, User } from 'lucide-react';
import { Card } from '@/components/ui';
import { ProfileEditForm } from './ProfileEditForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

export const metadata: Metadata = { title: 'My Profile · MediCore' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminSupabase = createAdminClient();

  const { data: patient } = await adminSupabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, email, phone, mrn, gender')
    .eq('profile_id', user.id)
    .single();

  // Last appointment
  const { data: lastAppt } = await adminSupabase
    .from('appointments')
    .select('scheduled_at, type, provider:profiles!appointments_provider_id_fkey(first_name, last_name)')
    .eq('patient_id', patient?.id ?? '')
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!patient) {
    redirect('/portal');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <UserCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">My Profile</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            View your data on file · Edit name & date of birth · Change password
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Current data snapshot ─────────────────────────────── */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border-muted))] pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-[hsl(var(--foreground))]">
              Your Data on File
            </h2>
          </div>

          <dl className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[hsl(var(--muted-foreground))] mb-0.5">Full Name</dt>
                <dd className="font-semibold text-[hsl(var(--foreground))] text-sm">
                  {patient.first_name} {patient.last_name}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[hsl(var(--muted-foreground))] mb-0.5">Date of Birth</dt>
                <dd className="font-semibold text-[hsl(var(--foreground))] text-sm">
                  {formatDate(patient.date_of_birth)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[hsl(var(--muted-foreground))] mb-0.5">Medical Record No.</dt>
                <dd className="font-mono font-semibold text-[hsl(var(--foreground))] tracking-wide">
                  {patient.mrn ?? '—'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[hsl(var(--muted-foreground))] mb-0.5">Email Address</dt>
                <dd className="font-semibold text-[hsl(var(--foreground))] break-all">
                  {patient.email ?? user.email ?? '—'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[hsl(var(--muted-foreground))] mb-0.5">Phone Number</dt>
                <dd className="font-semibold text-[hsl(var(--foreground))]">
                  {patient.phone ?? '—'}
                </dd>
              </div>
            </div>

            {lastAppt && (
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
                <div>
                  <dt className="text-[hsl(var(--muted-foreground))] mb-0.5">Last Appointment</dt>
                  <dd className="font-semibold text-[hsl(var(--foreground))]">
                    {formatDate(lastAppt.scheduled_at)}
                    {(lastAppt.provider as any) &&
                      ` · Dr. ${(lastAppt.provider as any).last_name}`}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </Card>

        {/* ── Right: Edit name / DOB ──────────────────────────────────── */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border-muted))] pb-3">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-[hsl(var(--foreground))]">
              Edit Profile
            </h2>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            You can update your display name and date of birth. Other fields (email, phone, MRN)
            can only be changed by your clinic.
          </p>
          <ProfileEditForm
            firstName={patient.first_name}
            lastName={patient.last_name}
            dateOfBirth={patient.date_of_birth}
          />
        </Card>
      </div>

      {/* ── Change Password ─────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border-muted))] pb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <div>
            <h2 className="text-xs font-semibold text-[hsl(var(--foreground))]">Change Password</h2>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Choose a strong password to keep your health data secure. Min. 8 characters.
            </p>
          </div>
        </div>
        <div className="max-w-sm">
          <ChangePasswordForm />
        </div>
      </Card>
    </div>
  );
}
