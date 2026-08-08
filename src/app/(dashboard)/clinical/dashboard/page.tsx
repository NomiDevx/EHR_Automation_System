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
  Activity, TrendingUp, ClipboardList, MessageSquare, Sparkles,
  ArrowRight, ShieldAlert, CheckSquare
} from 'lucide-react';
import { Card } from '@/components/ui';
import type { LabResultFlag, AppointmentStatus } from '@/lib/types/database';

export const metadata: Metadata = { title: 'Doctor Dashboard | MediSynx EHR' };

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
  const todayStartIso = todayStart.toISOString();
  const todayEndIso = todayEnd.toISOString();

  const [
    { data: todayAppts },
    { data: upcomingAppts },
    { data: draftNotes },
    { data: flaggedLabs },
    { data: myPatients },
    { count: unreadMsgCount },
  ] = await Promise.all([
    // Today's appointments for this doctor
    adminSupabase
      .from('appointments')
      .select('*, patient:patients(id, first_name, last_name, mrn)')
      .eq('provider_id', user.id)
      .gte('scheduled_at', todayStartIso)
      .lte('scheduled_at', todayEndIso)
      .order('scheduled_at'),

    // Upcoming appointments (next 6)
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

    // Flagged lab results from this doctor's patients
    adminSupabase
      .from('lab_results')
      .select('*, lab_order:lab_orders(test_name, ordering_provider_id), patient:patients(id, first_name, last_name)')
      .neq('flag', 'normal')
      .order('resulted_at', { ascending: false })
      .limit(8),

    // Patients count where this doctor is primary provider
    adminSupabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('primary_provider_id', user.id)
      .eq('is_active', true),

    // Unread patient messages count
    adminSupabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null),
  ]);

  // Filter flagged labs to only this doctor's patients
  const myFlaggedLabs = (flaggedLabs ?? []).filter(
    (l: any) => l.lab_order?.ordering_provider_id === user.id,
  );

  const completedToday = (todayAppts ?? []).filter((a: any) =>
    ['completed', 'in_progress'].includes(a.status),
  ).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto py-2">

      {/* ── HIGH-PERFORMANCE DOCTOR HERO BANNER ────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B2A55] via-[#0F766E] to-[#0891B2] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#0891B2]/30">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-[#22D3EE] backdrop-blur-sm">
              <Stethoscope className="w-3.5 h-3.5" /> Physician Workspace · {profile.specialty || 'General Practice'}
            </span>
            <h1 className="font-cambria text-2xl sm:text-3xl font-bold leading-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Dr. {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 font-normal">
              {formatDate(new Date().toISOString(), 'EEEE, MMMM d, yyyy')} · You have <strong className="text-white font-semibold">{todayAppts?.length ?? 0} consultations</strong> scheduled for today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/clinical/patients"
              id="doc-new-note-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0B2A55] font-bold text-xs hover:bg-[#F8FAFC] transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-[#0891B2]" /> Start New SOAP Note
            </Link>
            <Link
              href="/schedule"
              id="doc-schedule-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-xs hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Calendar className="w-4 h-4 text-[#22D3EE]" /> Schedule
            </Link>
            <Link
              href="/clinical/messages"
              id="doc-messages-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-xs hover:bg-white/20 transition-all backdrop-blur-sm relative"
            >
              <MessageSquare className="w-4 h-4 text-[#22D3EE]" /> Messages
              {(unreadMsgCount ?? 0) > 0 && (
                <span className="ml-1 bg-[#22D3EE] text-[#0B2A55] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {unreadMsgCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Live KPI Metric Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          {[
            { label: "Today's Appointments", value: todayAppts?.length ?? 0, icon: Calendar, color: 'text-[#22D3EE]' },
            { label: 'Completed Today', value: completedToday, icon: CheckCircle2, color: 'text-emerald-300' },
            { label: 'Pending Draft Notes', value: draftNotes?.length ?? 0, icon: PenLine, color: 'text-amber-300' },
            { label: 'Active Assigned Patients', value: (myPatients as any)?.count ?? '—', icon: Users, color: 'text-purple-300' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none font-cambria">{value}</p>
                <p className="text-[11px] text-slate-200 mt-1 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Today's Schedule Timeline Widget ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0891B2]" /> Today&apos;s Appointments Timeline
            </h2>
            <Link href="/schedule" className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
              Full Schedule <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(todayAppts?.length ?? 0) === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-10 text-center shadow-sm">
              <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto mb-2 opacity-50" />
              <h3 className="font-cambria text-base font-bold text-[#0B2A55]">No Appointments Today</h3>
              <p className="text-xs text-[#64748B] mt-1">There are no patient consultations scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts?.map((a: any) => {
                const isPast = new Date(a.scheduled_at) < new Date();
                return (
                  <div
                    key={a.id}
                    id={`today-appt-${a.id}`}
                    className="bg-white border border-[#E2E8F0] hover:border-[#0891B2] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Time Block */}
                      <div className="text-center min-w-[56px] shrink-0 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
                        <p className={cn('text-sm font-bold leading-none', isPast ? 'text-[#64748B]' : 'text-[#0891B2]')}>
                          {formatDate(a.scheduled_at, 'h:mm')}
                        </p>
                        <p className="text-[10px] font-semibold text-[#94A3B8] uppercase mt-0.5">{formatDate(a.scheduled_at, 'a')}</p>
                      </div>

                      {/* Patient Info */}
                      <div className="min-w-0">
                        <Link
                          href={`/clinical/patients/${a.patient_id}`}
                          className="font-cambria text-sm font-bold text-[#0B2A55] hover:text-[#0891B2] transition-colors truncate block"
                        >
                          {(a.patient as any)?.first_name} {(a.patient as any)?.last_name}
                        </Link>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">
                          {humanizeLabel(a.type)} · {a.duration_mins} min
                          {a.chief_complaint ? ` · ${a.chief_complaint}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-mono font-bold bg-[#0B2A55]/10 text-[#0B2A55] px-2 py-0.5 rounded-md">
                        {(a.patient as any)?.mrn}
                      </span>
                      <span className={cn('badge text-xs px-2.5 py-1 rounded-lg', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>
                        {a.status}
                      </span>
                      <Link
                        href={`/clinical/messages?to=${a.patient_id}`}
                        className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0891B2] transition-colors border border-[#E2E8F0]"
                        title="Send secure message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/clinical/patients/${a.patient_id}`}
                        className="p-2 rounded-xl bg-[#0891B2]/10 text-[#0891B2] hover:bg-[#0891B2] hover:text-white transition-all border border-[#0891B2]/20"
                        title="Open Patient Chart"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pending Draft SOAP Notes Widget ────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55] flex items-center gap-2">
              <PenLine className="w-5 h-5 text-amber-500" /> Pending Unsigned Notes
            </h2>
            <Link href="/clinical/notes" className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
              All Notes <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(draftNotes?.length ?? 0) === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 text-center shadow-sm">
              <CheckCircle2 className="w-9 h-9 text-[#16A34A] mx-auto mb-2 opacity-60" />
              <h4 className="font-cambria text-sm font-bold text-[#0B2A55]">All Notes Signed</h4>
              <p className="text-xs text-[#64748B] mt-1">No draft SOAP notes awaiting your clinical signature.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {draftNotes?.map((n: any) => (
                <Link
                  key={n.id}
                  href={`/clinical/patients/${n.patient_id}`}
                  id={`draft-note-${n.id}`}
                  className="bg-white border border-[#E2E8F0] hover:border-amber-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#0B2A55] group-hover:text-[#0891B2] transition-colors truncate">
                        {(n.patient as any)?.first_name} {(n.patient as any)?.last_name}
                      </p>
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        Draft
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Last edited {formatDate(n.updated_at, 'MMM d · h:mm a')}
                    </p>
                    {n.subjective && (
                      <p className="text-[11px] text-[#475569] mt-1 line-clamp-1 italic">
                        &quot;{n.subjective}&quot;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Flagged Lab Results & Upcoming Consultations Grid ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Flagged Lab Results Alert Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-red-500" /> Abnormal & Flagged Lab Diagnostic Alerts
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">
              {myFlaggedLabs.length} Alerts
            </span>
          </div>

          {myFlaggedLabs.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto opacity-50" />
              <p className="text-xs font-semibold text-[#0B2A55]">No Abnormal Results</p>
              <p className="text-[11px] text-[#64748B]">All patient diagnostic lab results are within normal ranges.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myFlaggedLabs.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0',
                      r.flag?.includes('critical') ? 'bg-red-500 animate-pulse' : 'bg-amber-500',
                    )} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0B2A55] truncate">
                        {(r.patient as any)?.first_name} {(r.patient as any)?.last_name}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {(r.lab_order as any)?.test_name || 'Lab Panel'} · {r.component_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn('font-mono text-xs font-bold', LAB_FLAG_COLORS[r.flag as LabResultFlag])}>
                      {r.value} {r.unit}
                    </p>
                    <span className={cn('inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md mt-0.5',
                      r.flag?.includes('critical')
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200',
                    )}>
                      {r.flag?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" /> Upcoming Consultations
            </h2>
            <Link href="/schedule" className="text-xs font-bold text-[#0891B2] hover:underline">View All →</Link>
          </div>

          {(upcomingAppts?.length ?? 0) === 0 ? (
            <div className="py-8 text-center space-y-1">
              <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto opacity-40" />
              <p className="text-xs font-semibold text-[#0B2A55]">No Upcoming Appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppts?.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/clinical/patients/${a.patient_id}`}
                  id={`upcoming-appt-${a.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-purple-300 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center min-w-[44px] rounded-xl bg-purple-50 border border-purple-200 py-1 px-2 shrink-0">
                      <p className="text-xs font-bold text-purple-700 leading-none">{formatDate(a.scheduled_at, 'd')}</p>
                      <p className="text-[9px] font-semibold text-purple-500 uppercase mt-0.5">{formatDate(a.scheduled_at, 'MMM')}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0B2A55] group-hover:text-[#0891B2] transition-colors truncate">
                        {(a.patient as any)?.first_name} {(a.patient as any)?.last_name}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {humanizeLabel(a.type)} · {formatDate(a.scheduled_at, 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  <span className={cn('badge text-[10px] px-2 py-0.5 shrink-0', APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus])}>
                    {a.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Action Shortcuts Grid ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
        {[
          { href: '/clinical/patients', label: 'View All Patients', icon: Users, color: 'text-[#0891B2]', bg: 'bg-[#0891B2]/10 border-[#0891B2]/20' },
          { href: '/schedule', label: 'Full Schedule', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { href: '/clinical/notes', label: 'Clinical Notes', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { href: '/clinical/patients', label: 'Patient Records', icon: ClipboardList, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
          { href: '/clinical/messages', label: 'Patient Messages', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link
            key={label}
            href={href}
            id={`doc-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`border ${bg} rounded-2xl flex flex-col items-center justify-center gap-2 py-5 text-center transition-all hover:scale-[1.02] shadow-sm hover:shadow-md`}
          >
            <Icon className={cn('w-5 h-5', color)} />
            <p className="text-xs font-bold text-[#0B2A55]">{label}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
