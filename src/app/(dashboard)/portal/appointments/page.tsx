import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalBookingClient } from '@/components/PortalBookingClient';
import { PortalAppointmentsClient } from './client';
import { Calendar } from 'lucide-react';

export const metadata: Metadata = { title: 'My Appointments' };

export default async function PortalAppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Always fetch profile + doctors in parallel ───────────────────
  const adminSupabase = createAdminClient();

  const [{ data: patient }, { data: profileData }, { data: doctorsData }] = await Promise.all([
    supabase.from('patients').select('id').eq('profile_id', user.id).single(),
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

  // ── No patient record yet — onboarding booking flow ─────────────
  if (!patient) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-6 animate-fade-in">
        <div className="card bg-gradient-to-r from-blue-600/20 to-blue-800/10 border-blue-500/20 p-6 flex flex-col items-center text-center gap-2">
          <Calendar className="w-12 h-12 text-blue-400 animate-pulse" />
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Schedule Your Onboarding Consultation
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-md">
            To activate your patient portal and view future appointments, please schedule your
            initial onboarding consultation below.
          </p>
        </div>
        <PortalBookingClient doctors={doctors} profile={profileData} />
      </div>
    );
  }

  // ── Patient exists — fetch full appointment history via admin client ─
  // The user supabase client relies on RLS (is_own_patient_record → profile_id match).
  // If profile_id wasn't linked yet on some records the query silently returns [].
  // We already proved this is the patient's own record via the profile_id lookup above,
  // so using adminSupabase here is safe and always returns the complete history.
  const { data: appointments } = await adminSupabase
    .from('appointments')
    .select('*, provider:profiles(first_name, last_name, specialty)')
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">My Appointments</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
      </div>

      {/* Appointments list + inline booking panel */}
      <PortalAppointmentsClient
        upcoming={upcoming as any}
        past={past as any}
        doctors={doctors}
        profile={profileData}
      />
    </div>
  );
}
