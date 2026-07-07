import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookAppointmentForm } from './client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Book Appointment' };

export default async function NewAppointmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: patients }, { data: providers }] = await Promise.all([
    supabase.from('patients').select('id, first_name, last_name, mrn').eq('is_active', true).order('last_name'),
    supabase.from('profiles').select('id, first_name, last_name, specialty').in('role', ['doctor', 'nurse']).eq('is_active', true),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/schedule" className="btn-ghost btn p-1.5"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Book Appointment</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Schedule a new patient appointment</p>
        </div>
      </div>
      <BookAppointmentForm patients={patients ?? []} providers={providers ?? []} createdById={user.id} />
    </div>
  );
}
