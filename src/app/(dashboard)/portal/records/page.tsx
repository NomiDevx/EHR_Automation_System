import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalRecordsClient } from './client';
import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';
import { FolderOpen, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'My Health Records | MediSynx EHR' };

export default async function PortalRecordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!patient) {
    return (
      <PortalOnboardingWarning 
        title="Medical Records Restricted" 
        description="To view your medical history, vitals, allergies, and clinical documentation, you must first complete your onboarding consultation."
      />
    );
  }

  const { data: vitals } = await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patient.id)
    .order('recorded_at', { ascending: false });

  const { data: allergies } = await supabase
    .from('allergies')
    .select('*')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5" /> Clinical Vitals & History
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">My Health Records</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Vitals history, logged allergies, and medical profile tracking.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
          <FolderOpen className="w-6 h-6" />
        </div>
      </div>

      <PortalRecordsClient
        patientId={patient.id}
        initialVitals={vitals ?? []}
        initialAllergies={allergies ?? []}
      />
    </div>
  );
}
