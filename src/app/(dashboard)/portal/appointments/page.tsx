import type { Metadata } from 'next';
import type { AppointmentStatus } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate, APPOINTMENT_STATUS_COLORS, humanizeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'My Appointments' };

export default async function PortalAppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
  if (!patient) redirect('/portal');

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, provider:profiles(first_name, last_name, specialty)')
    .eq('patient_id', patient.id)
    .order('scheduled_at', { ascending: false });

  const upcoming = appointments?.filter((a: any) => new Date(a.scheduled_at) > new Date() && !['cancelled','no_show'].includes(a.status)) ?? [];
  const past = appointments?.filter((a: any) => new Date(a.scheduled_at) <= new Date() || ['cancelled','no_show'].includes(a.status)) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">My Appointments</h1>

      {upcoming.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((a: any) => (
              <div key={a.id} className="card-hover flex items-center gap-4">
                <div className="text-center min-w-[60px] rounded-lg bg-blue-500/10 border border-blue-500/20 py-2">
                  <p className="text-lg font-bold text-blue-300">{formatDate(a.scheduled_at, 'd')}</p>
                  <p className="text-xs text-blue-400/70">{formatDate(a.scheduled_at, 'MMM yyyy')}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.chief_complaint ?? humanizeLabel(a.type)}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Dr. {(a.provider as any)?.last_name} · {(a.provider as any)?.specialty}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(a.scheduled_at, 'h:mm a')} · {a.duration_mins} min</p>
                </div>
                <span className={cn('badge text-xs', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Past Visits</h2>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Provider</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {past.map((a: any) => (
                <tr key={a.id}>
                  <td>{formatDate(a.scheduled_at, 'MMM d, yyyy h:mm a')}</td>
                  <td>Dr. {(a.provider as any)?.last_name}</td>
                  <td>{humanizeLabel(a.type)}</td>
                  <td><span className={cn('badge text-xs', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!appointments?.length && (
        <div className="text-center py-16">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No appointments on record</p>
        </div>
      )}
    </div>
  );
}
