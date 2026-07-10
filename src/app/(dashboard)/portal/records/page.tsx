import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalRecordsClient } from './client';

import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';

export const metadata: Metadata = { title: 'My Health Records | Portal' };

export default async function PortalRecordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Get patient record linked to portal account
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  // If they don't have a patient record, they can't log health details yet, show onboarding warning
  if (!patient) {
    return (
      <PortalOnboardingWarning 
        title="Medical Records Restricted" 
        description="To view your medical history, vitals, allergies, and clinical documentation, you must first complete your onboarding consultation."
      />
    );
  }

  // 2. Fetch logged vitals
  const { data: vitals } = await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patient.id)
    .order('recorded_at', { ascending: false });

  // 3. Fetch logged allergies
  const { data: allergies } = await supabase
    .from('allergies')
    .select('*')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">My Health Records</h1>
      </div>
      <PortalRecordsClient
        patientId={patient.id}
        initialVitals={vitals ?? []}
        initialAllergies={allergies ?? []}
      />
    </div>
  );
}
