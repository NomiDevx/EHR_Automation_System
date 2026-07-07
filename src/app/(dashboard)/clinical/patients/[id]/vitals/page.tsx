import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VitalsFormClient } from './client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Record Vitals' };

export default async function VitalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase
    .from('patients').select('first_name, last_name, mrn').eq('id', patientId).single();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/clinical/patients/${patientId}`} className="btn-ghost btn p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Record Vitals</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {patient?.first_name} {patient?.last_name} · {patient?.mrn}
          </p>
        </div>
      </div>
      <VitalsFormClient patientId={patientId} recordedById={user.id} />
    </div>
  );
}
