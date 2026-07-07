import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ScheduleClient } from './client';
import { CalendarPlus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Schedule' };

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch appointments for the next 60 days + past 30 days
  const start = new Date(Date.now() - 30 * 86400000).toISOString();
  const end = new Date(Date.now() + 60 * 86400000).toISOString();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(first_name, last_name, mrn), provider:profiles(first_name, last_name)')
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at', { ascending: true });

  const { data: providers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, specialty')
    .in('role', ['doctor', 'nurse']);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Schedule</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{appointments?.length ?? 0} appointments in view</p>
        </div>
        <Link href="/schedule/new" id="new-appointment-btn" className="btn-primary btn">
          <CalendarPlus className="w-4 h-4" />
          Book Appointment
        </Link>
      </div>
      <ScheduleClient appointments={appointments ?? []} providers={providers ?? []} currentUserId={user?.id ?? ''} />
    </div>
  );
}
