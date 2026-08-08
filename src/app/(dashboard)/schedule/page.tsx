import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ScheduleClient } from './client';
import { CalendarPlus, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Clinical Schedule | MediSynx EHR' };

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch appointments for the next 90 days + past 30 days
  const start = new Date(Date.now() - 30 * 86400000).toISOString();
  const end = new Date(Date.now() + 90 * 86400000).toISOString();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(first_name, last_name, mrn, date_of_birth, gender), provider:profiles!appointments_provider_id_fkey(first_name, last_name, specialty)')
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at', { ascending: true });

  const { data: providers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, specialty')
    .in('role', ['doctor', 'nurse'])
    .order('last_name', { ascending: true });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto py-2">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5" /> Clinical Appointments & Consultations
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">Master Clinical Schedule</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Manage patient bookings, provider calendars, and consultation statuses in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex px-3 py-1.5 rounded-xl bg-[#0B2A55]/10 text-[#0B2A55] text-xs font-extrabold border border-[#0B2A55]/20">
            {appointments?.length ?? 0} Appointments in View
          </span>
          <Link
            href="/schedule/new"
            id="new-appointment-btn"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-xs font-bold hover:opacity-95 shadow-md transition-all shrink-0"
          >
            <CalendarPlus className="w-4 h-4 text-[#22D3EE]" />
            Book Appointment
          </Link>
        </div>
      </div>

      <ScheduleClient
        appointments={appointments ?? []}
        providers={providers ?? []}
        currentUserId={user?.id ?? ''}
      />
    </div>
  );
}
