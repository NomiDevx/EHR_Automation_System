import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegisterPatientForm } from './client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Register Patient' };

export default async function RegisterPatientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: providers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, specialty')
    .in('role', ['doctor'])
    .eq('is_active', true)
    .order('last_name');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/reception" className="btn-ghost btn p-1.5"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Register New Patient</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Complete patient intake form</p>
        </div>
      </div>
      <RegisterPatientForm providers={providers ?? []} createdById={user.id} />
    </div>
  );
}
