import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SOAPEditor } from '@/components/clinical/SOAPEditor';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'New SOAP Note' };

export default async function NewNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase
    .from('patients').select('first_name, last_name').eq('id', patientId).single();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/clinical/patients/${patientId}`} className="btn-ghost btn p-1.5" id="back-to-chart-btn">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">New SOAP Note</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {patient?.first_name} {patient?.last_name}
          </p>
        </div>
      </div>
      <SOAPEditor patientId={patientId} providerId={user.id} />
    </div>
  );
}
