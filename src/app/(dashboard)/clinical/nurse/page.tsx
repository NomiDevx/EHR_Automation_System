import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, APPOINTMENT_STATUS_COLORS, humanizeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Users, Calendar, Activity, CheckCircle2,
  ChevronRight, Clock, AlertCircle, ClipboardList,
  HeartPulse, Thermometer, Droplet, Wind,
  UserCheck, LayoutDashboard, Plus,
} from 'lucide-react';
import { Card } from '@/components/ui';
import type { AppointmentStatus } from '@/lib/types/database';

export const metadata: Metadata = { title: 'Nurse Dashboard' };

export default async function NurseDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'nurse') redirect('/login');

  const adminSupabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { data: todayAppts },
    { data: myRecentVitals },
    { data: vitalsToday },
  ] = await Promise.all([
    // All of today's appointments (all doctors) — nurse sees the full floor
    adminSupabase
      .from('appointments')
      .select('*, patient:patients(id, first_name, last_name, mrn), provider:profiles(first_name, last_name)')
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .order('scheduled_at'),

    // Vitals recently logged BY this nurse
    adminSupabase
      .from('vitals')
      .select('*, patient:patients(id, first_name, last_name)')
      .eq('recorded_by', user.id)
      .order('recorded_at', { ascending: false })
      .limit(6),

    // All vitals recorded today (to check which patients already have vitals)
    adminSupabase
      .from('vitals')
      .select('patient_id')
      .gte('recorded_at', todayStart.toISOString())
      .lte('recorded_at', todayEnd.toISOString()),
  ]);

  // Patients who have an appointment today but NO vitals recorded yet
  const vitalsRecordedPatientIds = new Set((vitalsToday ?? []).map((v: any) => v.patient_id));
  const vitalsDue = (todayAppts ?? []).filter(
    (a: any) => !vitalsRecordedPatientIds.has(a.patient_id),
  );

  const completedToday = (todayAppts ?? []).filter((a: any) =>
    ['completed', 'in_progress'].includes(a.status),
  ).length;

  const now = new Date();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600/20 via-teal-800/10 to-transparent border border-teal-500/20 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175,70%,40%,0.07)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-teal-400 font-medium uppercase tracking-wider">Nurse Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'},
              {' '}{profile.first_name}
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {profile.department || 'Clinical Nursing'} · {formatDate(now.toISOString(), 'EEEE, MMMM d yyyy')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/clinical/vitals"
              id="nurse-record-vitals-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Record Vitals
            </Link>
            <Link
              href="/schedule"
              id="nurse-schedule-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/20 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Today's Patients", value: todayAppts?.length ?? 0, icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
            { label: 'Seen Today', value: completedToday, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Vitals Due', value: vitalsDue.length, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Vitals Recorded', value: myRecentVitals?.length ?? 0, icon: HeartPulse, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
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

        {/* ── Today's Patient Flow ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" /> Today&apos;s Patient Flow
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
                const isPast = new Date(a.scheduled_at) < now;
                const hasVitals = vitalsRecordedPatientIds.has(a.patient_id);
                return (
                  <div
                    key={a.id}
                    className="card flex items-center gap-4 group"
                  >
                    {/* Time */}
                    <div className="text-center min-w-[50px] shrink-0">
                      <p className={cn('text-sm font-bold leading-none', isPast ? 'text-[hsl(var(--muted-foreground))]' : 'text-teal-300')}>
                        {formatDate(a.scheduled_at, 'h:mm')}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatDate(a.scheduled_at, 'a')}</p>
                    </div>

                    {/* Divider */}
                    <div className={cn('w-0.5 h-10 rounded-full shrink-0', isPast ? 'bg-[hsl(var(--border))]' : 'bg-teal-500/40')} />

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/clinical/patients/${a.patient_id}`}
                        id={`nurse-patient-${a.id}`}
                        className="text-sm font-semibold text-[hsl(var(--foreground))] hover:text-teal-300 transition-colors truncate block"
                      >
                        {(a.patient as any)?.first_name} {(a.patient as any)?.last_name}
                      </Link>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        Dr. {(a.provider as any)?.last_name} · {humanizeLabel(a.type)}
                        {' · '}{(a.patient as any)?.mrn}
                      </p>
                    </div>

                    {/* Status + vitals indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {hasVitals ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Vitals ✓
                        </span>
                      ) : (
                        <Link
                          href={`/clinical/patients/${a.patient_id}`}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/20 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3" /> Record
                        </Link>
                      )}
                      <span className={cn('badge text-[10px]', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Vitals Due ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Vitals Due
            </h2>
            {vitalsDue.length > 0 && (
              <span className="badge bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs animate-pulse">
                {vitalsDue.length} pending
              </span>
            )}
          </div>

          {vitalsDue.length === 0 ? (
            <Card className="py-8 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400/50 mx-auto mb-2" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">All patients have vitals recorded</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {vitalsDue.slice(0, 6).map((a: any) => (
                <Link
                  key={a.id}
                  href={`/clinical/patients/${a.patient_id}`}
                  id={`vitals-due-${a.id}`}
                  className="card-hover flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate group-hover:text-teal-300 transition-colors">
                      {(a.patient as any)?.first_name} {(a.patient as any)?.last_name}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {formatDate(a.scheduled_at, 'h:mm a')} · Dr. {(a.provider as any)?.last_name}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── My Recent Vitals ──────────────────────────────────────── */}
      <Card>
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> My Recent Vitals
          </h2>
          <Link href="/clinical/vitals" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
        </div>

        {(myRecentVitals?.length ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <Activity className="w-7 h-7 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No vitals recorded yet today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-4">Patient</th>
                  <th className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-red-400" /> BP</th>
                  <th className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-pink-400" /> HR</th>
                  <th className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-orange-400" /> Temp</th>
                  <th className="flex items-center gap-1"><Wind className="w-3 h-3 text-blue-400" /> SpO₂</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {myRecentVitals?.map((v: any) => (
                  <tr key={v.id}>
                    <td className="pl-4">
                      <Link
                        href={`/clinical/patients/${v.patient_id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        {(v.patient as any)?.first_name} {(v.patient as any)?.last_name}
                      </Link>
                    </td>
                    <td className="font-mono text-xs">
                      {v.blood_pressure_systolic && v.blood_pressure_diastolic
                        ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`
                        : '—'}
                    </td>
                    <td className="text-xs">{v.heart_rate ? `${v.heart_rate} bpm` : '—'}</td>
                    <td className="text-xs">{v.temperature_f ? `${v.temperature_f}°F` : '—'}</td>
                    <td className="text-xs">
                      {v.oxygen_saturation
                        ? <span className={cn('font-semibold', v.oxygen_saturation < 95 ? 'text-amber-400' : 'text-emerald-400')}>
                            {v.oxygen_saturation}%
                          </span>
                        : '—'}
                    </td>
                    <td className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {formatDate(v.recorded_at, 'h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/clinical/patients', label: 'All Patients', icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
          { href: '/schedule', label: 'Today\'s Schedule', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { href: '/clinical/vitals', label: 'Record Vitals', icon: HeartPulse, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { href: '/clinical/patients', label: 'Patient Charts', icon: ClipboardList, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link
            key={`${href}-${label}`}
            href={href}
            id={`nurse-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
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
