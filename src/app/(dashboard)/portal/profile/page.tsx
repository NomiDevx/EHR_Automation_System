import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { UserCircle, ShieldCheck, CalendarDays, Mail, Phone, CreditCard, User, Sparkles } from 'lucide-react';
import { ProfileEditForm } from './ProfileEditForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

export const metadata: Metadata = { title: 'My Profile | MediSynx EHR' };

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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0B2A55]/10 text-[#0B2A55] border border-[#0B2A55]/20">
            <Sparkles className="w-3.5 h-3.5" /> Security & Profile
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">My Profile Settings</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            View details on file · Edit personal data · Change account password
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0B2A55]/10 border border-[#0B2A55]/20 flex items-center justify-center text-[#0B2A55] shrink-0">
          <UserCircle className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current data snapshot */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
            <ShieldCheck className="w-5 h-5 text-[#0891B2]" />
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Your Data on File</h2>
          </div>

          <dl className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
              <User className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[#94A3B8] font-medium">Full Name</dt>
                <dd className="font-bold text-[#0F172A] text-sm mt-0.5">
                  {patient.first_name} {patient.last_name}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
              <CalendarDays className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[#94A3B8] font-medium">Date of Birth</dt>
                <dd className="font-bold text-[#0F172A] text-sm mt-0.5">
                  {formatDate(patient.date_of_birth)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
              <CreditCard className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[#94A3B8] font-medium">Medical Record No.</dt>
                <dd className="font-mono font-bold text-[#0891B2] tracking-wide mt-0.5">
                  {patient.mrn ?? '—'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
              <Mail className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[#94A3B8] font-medium">Email Address</dt>
                <dd className="font-semibold text-[#0F172A] break-all mt-0.5">
                  {patient.email ?? user.email ?? '—'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
              <Phone className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
              <div>
                <dt className="text-[#94A3B8] font-medium">Phone Number</dt>
                <dd className="font-semibold text-[#0F172A] mt-0.5">
                  {patient.phone ?? '—'}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Change password card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
            <ShieldCheck className="w-5 h-5 text-[#0891B2]" />
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Update Security Password</h2>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            Choose a strong password to keep your medical charts and portal access secure. Minimum 8 characters.
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
