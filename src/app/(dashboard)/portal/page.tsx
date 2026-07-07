import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatDateTime, LAB_FLAG_COLORS } from '@/lib/utils';
import { Calendar, FlaskConical, Pill, MessageSquare, FileText, ChevronRight, HeartPulse } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { LabResultFlag } from '@/lib/types/database';

export const metadata: Metadata = { title: 'My Health Portal' };

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get patient record linked to this portal user
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <HeartPulse className="w-12 h-12 text-blue-400" />
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">No Patient Record Found</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center max-w-sm">
          Your account isn't linked to a patient record yet. Please contact the clinic to link your portal account.
        </p>
      </div>
    );
  }

  const [
    { data: upcomingAppts },
    { data: recentNotes },
    { data: recentLabs },
    { data: activeMeds },
    { data: unreadMessages },
  ] = await Promise.all([
    supabase.from('appointments').select('*, provider:profiles(first_name, last_name, specialty)')
      .eq('patient_id', patient.id).gte('scheduled_at', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed']).order('scheduled_at').limit(3),
    supabase.from('clinical_notes').select('*, provider:profiles(first_name, last_name)')
      .eq('patient_id', patient.id).eq('status', 'signed').order('signed_at', { ascending: false }).limit(3),
    supabase.from('lab_results').select('*, lab_order:lab_orders(test_name)')
      .eq('patient_id', patient.id).order('resulted_at', { ascending: false }).limit(5),
    supabase.from('prescriptions').select('*').eq('patient_id', patient.id).eq('status', 'active').limit(5),
    supabase.from('messages').select('id').eq('recipient_id', user.id).is('read_at', null),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="card bg-gradient-to-r from-blue-600/20 to-blue-800/10 border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              Welcome, {patient.first_name}
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {patient.mrn} · DOB: {formatDate(patient.date_of_birth)}
            </p>
          </div>
          <HeartPulse className="w-10 h-10 text-blue-400 opacity-50" />
        </div>
      </div>

      {/* Quick nav tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/portal/appointments', label: 'Appointments', icon: Calendar, count: upcomingAppts?.length ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { href: '/portal/labs', label: 'Lab Results', icon: FlaskConical, count: recentLabs?.filter((l: any) => l.flag !== 'normal').length ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { href: '/portal/medications', label: 'Medications', icon: Pill, count: activeMeds?.length ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { href: '/portal/messages', label: 'Messages', icon: MessageSquare, count: unreadMessages?.length ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map(({ href, label, icon: Icon, count, color, bg }) => (
          <Link key={href} href={href} id={`portal-nav-${label.toLowerCase().replace(' ','-')}`} className={`card-hover border ${bg} flex flex-col items-center gap-2 py-4 text-center`}>
            <Icon className={cn('w-6 h-6', color)} />
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">{label}</p>
            {count > 0 && <span className={cn('badge text-xs', bg, color)}>{count}</span>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <Card>
          <div className="section-header">
            <h2 className="section-title">Upcoming Appointments</h2>
            <Link href="/portal/appointments" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          <div className="space-y-3">
            {upcomingAppts?.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 py-2 border-b border-[hsl(var(--border-muted))] last:border-0">
                <div className="text-center min-w-[52px] rounded-lg bg-blue-500/10 border border-blue-500/20 py-1.5">
                  <p className="text-sm font-bold text-blue-300">{formatDate(a.scheduled_at, 'd')}</p>
                  <p className="text-xs text-blue-400/70">{formatDate(a.scheduled_at, 'MMM')}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.chief_complaint ?? 'Appointment'}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Dr. {(a.provider as any)?.last_name} · {formatDate(a.scheduled_at, 'h:mm a')}
                  </p>
                </div>
                <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">{a.status}</span>
              </div>
            ))}
            {!upcomingAppts?.length && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">No upcoming appointments</p>
            )}
          </div>
        </Card>

        {/* Recent lab results */}
        <Card>
          <div className="section-header">
            <h2 className="section-title">Recent Lab Results</h2>
            <Link href="/portal/labs" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentLabs?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-[hsl(var(--border-muted))] last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.component_name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {(r.lab_order as any)?.test_name} · {formatDate(r.resulted_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('font-mono text-sm font-semibold', LAB_FLAG_COLORS[r.flag as LabResultFlag])}>{r.value} {r.unit}</p>
                  {r.flag !== 'normal' && (
                    <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">{r.flag.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </div>
            ))}
            {!recentLabs?.length && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">No recent results</p>
            )}
          </div>
        </Card>
      </div>

      {/* Active medications */}
      {(activeMeds?.length ?? 0) > 0 && (
        <Card>
          <div className="section-header">
            <h2 className="section-title">Active Medications</h2>
            <Link href="/portal/medications" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeMeds?.map((rx: any) => (
              <div key={rx.id} className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border-muted))]">
                <Pill className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{rx.drug_name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{rx.dosage} · {rx.frequency}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
