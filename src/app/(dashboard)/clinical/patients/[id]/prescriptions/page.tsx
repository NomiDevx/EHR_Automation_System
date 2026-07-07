import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PrescriptionFormClient } from './client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'e-Prescribe' };

export default async function PrescriptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase
    .from('patients').select('first_name, last_name, mrn').eq('id', patientId).single();
  const { data: allergies } = await supabase
    .from('allergies').select('allergen, severity').eq('patient_id', patientId).eq('is_active', true);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/clinical/patients/${patientId}`} className="btn-ghost btn p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">e-Prescribe</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {patient?.first_name} {patient?.last_name} · {patient?.mrn}
          </p>
        </div>
      </div>
      <PrescriptionFormClient patientId={patientId} prescriberId={user.id} allergies={allergies ?? []} />
    </div>
  );
}
