import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatDateTime, APPOINTMENT_STATUS_COLORS, humanizeLabel, LAB_FLAG_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Users, Calendar, FileText, FlaskConical,
  ChevronRight, Clock, CheckCircle2, AlertTriangle,
  Stethoscope, PenLine, Plus, LayoutDashboard,
  Activity, TrendingUp, ClipboardList, MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui';
import type { LabResultFlag, AppointmentStatus } from '@/lib/types/database';

export const metadata: Metadata = { title: 'Doctor Dashboard' };

export default async function DoctorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'doctor') redirect('/login');

  const adminSupabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const nowIso = new Date().toISOString();
  const todayStartIso = todayStart.toISOString();
  const todayEndIso = todayEnd.toISOString();

  const [
    { data: todayAppts },
    { data: upcomingAppts },
    { data: draftNotes },
    { data: flaggedLabs },
    { data: myPatients },
  ] = await Promise.all([
    // Today's appointments for this doctor
    adminSupabase
      .from('appointments')
      .select('*, patient:patients(id, first_name, last_name, mrn)')
      .eq('provider_id', user.id)
      .gte('scheduled_at', todayStartIso)
      .lte('scheduled_at', todayEndIso)
      .order('scheduled_at'),

    // Upcoming (beyond today) — next 6
    adminSupabase
      .from('appointments')
      .select('*, patient:patients(id, first_name, last_name)')
      .eq('provider_id', user.id)
      .gt('scheduled_at', todayEndIso)
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduled_at')
      .limit(6),

    // Draft/unsigned clinical notes by this doctor
    adminSupabase
      .from('clinical_notes')
      .select('*, patient:patients(id, first_name, last_name, mrn)')
      .eq('provider_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(5),

    // Flagged lab results from this doctor's patients (recent, abnormal)
    adminSupabase
      .from('lab_results')
      .select('*, lab_order:lab_orders(test_name, ordering_provider_id), patient:patients(id, first_name, last_name)')
      .neq('flag', 'normal')
      .order('resulted_at', { ascending: false })
      .limit(8),

    // Patients where this doctor is primary provider (count)
    adminSupabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('primary_provider_id', user.id)
      .eq('is_active', true),
  ]);

  // Filter flagged labs to only this doctor's patients
  const myFlaggedLabs = (flaggedLabs ?? []).filter(
    (l: any) => l.lab_order?.ordering_provider_id === user.id,
  );

  const completedToday = (todayAppts ?? []).filter((a: any) =>
    ['completed', 'in_progress'].includes(a.status),
  ).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/25 via-blue-800/15 to-transparent border border-blue-500/20 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(220,70%,50%,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">Doctor Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
              Dr. {profile.last_name}
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {profile.specialty || 'General Practice'} · {formatDate(new Date().toISOString(), 'EEEE, MMMM d yyyy')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/clinical/patients/new"
              id="doc-new-note-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:bg-[hsl(220,55%,28%)] transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> New Note
            </Link>
            <Link
              href="/schedule"
              id="doc-schedule-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/20 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Today's Appointments", value: todayAppts?.length ?? 0, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Completed Today', value: completedToday, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Pending Notes', value: draftNotes?.length ?? 0, icon: PenLine, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Active Patients', value: (myPatients as any)?.count ?? '—', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
              <Icon className={cn('w-5 h-5 shrink-0', color)} />
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))] leading-none">{value}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Today's Schedule ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Today&apos;s Schedule
            </h2>
            <Link href="/schedule" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Full schedule <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {(todayAppts?.length ?? 0) === 0 ? (
            <Card className="py-10 text-center">
              <Calendar className="w-8 h-8 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-2" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No appointments scheduled for today</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayAppts?.map((a: any) => {
                const isPast = new Date(a.scheduled_at) < new Date();
                return (
                  <Link
                    key={a.id}
                    href={`/clinical/patients/${a.patient_id}`}
                    id={`today-appt-${a.id}`}
                    className="card-hover flex items-center gap-4 group"
                  >
                    {/* Time column */}
                    <div className="text-center min-w-[52px] shrink-0">
                      <p className={cn('text-sm font-bold leading-none', isPast ? 'text-[hsl(var(--muted-foreground))]' : 'text-blue-300')}>
                        {formatDate(a.scheduled_at, 'h:mm')}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatDate(a.scheduled_at, 'a')}</p>
                    </div>

                    {/* Divider */}
                    <div className={cn('w-0.5 h-10 rounded-full shrink-0', isPast ? 'bg-[hsl(var(--border))]' : 'bg-blue-500/40')} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate group-hover:text-blue-300 transition-colors">
                        {(a.patient as any)?.first_name} {(a.patient as any)?.last_name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {humanizeLabel(a.type)} · {a.duration_mins} min
                        {a.chief_complaint ? ` · ${a.chief_complaint}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{(a.patient as any)?.mrn}</p>
                      <span className={cn('badge text-xs', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>
                        {a.status}
                      </span>
                      <Link
                        href={`/clinical/messages?to=${a.patient_id}`}
                        className="p-1 rounded hover:bg-[hsl(var(--surface-hover))] text-[hsl(var(--muted-foreground))] hover:text-blue-400 transition-colors"
                        title="Send secure message to patient"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Link>
                      <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pending Notes ────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <PenLine className="w-4 h-4 text-amber-400" /> Pending Notes
            </h2>
            <Link href="/clinical/notes" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              All notes <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {(draftNotes?.length ?? 0) === 0 ? (
            <Card className="py-8 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400/50 mx-auto mb-2" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">All notes are signed</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {draftNotes?.map((n: any) => (
                <Link
                  key={n.id}
                  href={`/clinical/patients/${n.patient_id}`}
                  id={`draft-note-${n.id}`}
                  className="card-hover flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate group-hover:text-blue-300 transition-colors">
                      {(n.patient as any)?.first_name} {(n.patient as any)?.last_name}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {formatDate(n.updated_at, 'MMM d · h:mm a')}
                    </p>
                    {n.subjective && (
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1 opacity-70">
                        {n.subjective}
                      </p>
                    )}
                  </div>
                  <span className="badge text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0">Draft</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Flagged Lab Results ──────────────────────────────────── */}
        <Card>
          <div className="section-header">
            <h2 className="section-title flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-red-400" /> Flagged Lab Results
            </h2>
            <span className="badge bg-red-500/10 text-red-400 border-red-500/20 text-xs">
              {myFlaggedLabs.length} abnormal
            </span>
          </div>

          {myFlaggedLabs.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400/50 mx-auto mb-2" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No flagged results</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myFlaggedLabs.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[hsl(var(--border-muted))] last:border-0">
                  <div className={cn('w-2 h-2 rounded-full shrink-0',
                    r.flag?.includes('critical') ? 'bg-red-500 animate-pulse' : 'bg-amber-400',
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                      {(r.patient as any)?.first_name} {(r.patient as any)?.last_name}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {(r.lab_order as any)?.test_name} · {r.component_name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono text-xs font-bold', LAB_FLAG_COLORS[r.flag as LabResultFlag])}>
                      {r.value} {r.unit}
                    </p>
                    <span className={cn('badge text-[10px]',
                      r.flag?.includes('critical')
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    )}>
                      {r.flag?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Upcoming Appointments ─────────────────────────────────── */}
        <Card>
          <div className="section-header">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Upcoming Appointments
            </h2>
            <Link href="/schedule" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>

          {(upcomingAppts?.length ?? 0) === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="w-7 h-7 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-2" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAppts?.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/clinical/patients/${a.patient_id}`}
                  id={`upcoming-appt-${a.id}`}
                  className="flex items-center gap-3 py-2 border-b border-[hsl(var(--border-muted))] last:border-0 hover:bg-[hsl(var(--surface-hover))] -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="text-center min-w-[44px] rounded-lg bg-purple-500/10 border border-purple-500/20 py-1.5 shrink-0">
                    <p className="text-sm font-bold text-purple-300 leading-none">{formatDate(a.scheduled_at, 'd')}</p>
                    <p className="text-[9px] text-purple-400/70">{formatDate(a.scheduled_at, 'MMM')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate group-hover:text-blue-300 transition-colors">
                      {(a.patient as any)?.first_name} {(a.patient as any)?.last_name}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {humanizeLabel(a.type)} · {formatDate(a.scheduled_at, 'h:mm a')}
                    </p>
                  </div>
                  <span className={cn('badge text-[10px] shrink-0', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>
                    {a.status}
                  </span>
                  <Link
                    href={`/clinical/messages?to=${a.patient_id}`}
                    className="p-1 rounded hover:bg-[hsl(var(--surface-hover))] text-[hsl(var(--muted-foreground))] hover:text-blue-400 transition-colors shrink-0"
                    title="Send secure message to patient"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Link>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { href: '/clinical/patients', label: 'View All Patients', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { href: '/schedule', label: 'Full Schedule', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { href: '/clinical/notes', label: 'Clinical Notes', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { href: '/clinical/patients', label: 'Patient Records', icon: ClipboardList, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
          { href: '/clinical/messages', label: 'Patient Messages', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            id={`doc-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`card-hover border ${bg} flex flex-col items-center gap-2.5 py-5 text-center`}
          >
            <Icon className={cn('w-5 h-5', color)} />
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
