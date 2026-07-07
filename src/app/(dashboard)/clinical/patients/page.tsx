import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PatientListClient } from './client';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Patients' };

export default async function PatientsPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from('patients')
    .select('*, primary_provider:profiles!patients_primary_provider_id_fkey(first_name, last_name, specialty)')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Patients</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {patients?.length ?? 0} active patients
          </p>
        </div>
        <Link href="/reception/patients/new" id="register-patient-btn" className="btn-primary btn">
          <UserPlus className="w-4 h-4" />
          Register Patient
        </Link>
      </div>

      <PatientListClient patients={patients ?? []} />
    </div>
  );
}
