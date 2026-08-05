import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalBookingClient } from '@/components/PortalBookingClient';
import { PortalAppointmentsClient } from './client';
import { Calendar, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'My Appointments | MediSynx EHR' };

export default async function PortalAppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminSupabase = createAdminClient();

  const [{ data: patient }, { data: profileData }, { data: doctorsData }] = await Promise.all([
    supabase.from('patients').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    adminSupabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('last_name', { ascending: true }),
  ]);

  if (!profileData) redirect('/login');

  const doctors = doctorsData ?? [];

  // No patient record yet — onboarding booking flow with DOB auto-filled if available
  if (!patient) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-6 animate-fade-in">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B2A55] via-[#0F766E] to-[#0891B2] text-white rounded-3xl p-8 text-center space-y-3 shadow-xl border border-[#0891B2]/30">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-[#22D3EE] backdrop-blur-sm">
            <Calendar className="w-7 h-7" />
          </div>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold">
            Schedule Your Onboarding Consultation
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto leading-relaxed">
            To activate your patient portal and view future medical charts, please schedule your initial consultation below.
          </p>
        </div>

        <PortalBookingClient doctors={doctors} profile={profileData} />
      </div>
    );
  }

  // Patient exists — fetch full appointment history
  const { data: appointments } = await adminSupabase
    .from('appointments')
    .select('*, provider:profiles!appointments_provider_id_fkey(first_name, last_name, specialty)')
    .eq('patient_id', patient.id)
    .order('scheduled_at', { ascending: false });

  const now = new Date();

  const upcoming = (appointments ?? []).filter(
    (a: any) =>
      new Date(a.scheduled_at) > now &&
      !['cancelled', 'no_show'].includes(a.status),
  );

  const past = (appointments ?? []).filter(
    (a: any) =>
      new Date(a.scheduled_at) <= now ||
      ['cancelled', 'no_show'].includes(a.status),
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5" /> Outpatient Schedule
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">My Appointments</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            {upcoming.length} upcoming · {past.length} past consultations · Patient DOB: {patient.date_of_birth ?? 'On file'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* Appointments Client Component with fetched patientRecord */}
      <PortalAppointmentsClient
        upcoming={upcoming as any}
        past={past as any}
        doctors={doctors}
        profile={profileData}
        patientRecord={patient}
      />
    </div>
  );
}
