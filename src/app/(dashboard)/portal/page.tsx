import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, LAB_FLAG_COLORS } from '@/lib/utils';
import { 
  Calendar, FlaskConical, Pill, MessageSquare, FileText, 
  ChevronRight, HeartPulse, CheckCircle2, UserCheck, 
  Stethoscope, Phone, Clock, MapPin, ArrowRight, Activity,
  User, Mail, CreditCard, CalendarDays, ShieldCheck, Sparkles,
  Award, Lock, ChevronDown, Check, Video
} from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { LabResultFlag } from '@/lib/types/database';
import { ChangePasswordForm } from './components/ChangePasswordForm';
import Image from 'next/image';

export const metadata: Metadata = { title: 'My Health Portal | MediSynx EHR' };

interface PortalPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminSupabase = createAdminClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get patient record linked to this portal user
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  /* ── UNLINKED / NEW PATIENT ONBOARDING DASHBOARD ────────────────── */
  if (!patient) {
    if (!profile) redirect('/login');

    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    const isSuccess = searchParams?.booking_success === 'true';

    return (
      <div className="space-y-8 max-w-6xl mx-auto py-4 animate-fade-in">
        {isSuccess && (
          <div className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] text-sm font-medium shadow-sm animate-slide-up">
            <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
            <div>
              <p className="font-bold text-[#16A34A]">Appointment Confirmed!</p>
              <p className="text-xs text-[#475569] mt-0.5">
                Your consultation has been booked successfully. Our care team will review your chart details shortly.
              </p>
            </div>
          </div>
        )}

        {/* Welcome Hero Banner — Navy to Cyan Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B2A55] via-[#0F766E] to-[#0891B2] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#0891B2]/30">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-[#22D3EE] backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" /> Patient Portal Account Active
              </span>
              <h1 className="font-cambria text-3xl sm:text-4xl font-bold leading-tight">
                Welcome, {profile?.first_name} {profile?.last_name}!
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                Your portal account is active. Complete your clinical onboarding checklist below to initialize your medical record and access lab results, appointments, and care team messaging.
              </p>
            </div>

            <Link
              href="/#booking-section"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0B2A55] font-bold text-xs hover:bg-[#F8FAFC] transition-all shadow-md shrink-0"
            >
              Book Consult <ArrowRight className="w-4 h-4 text-[#0891B2]" />
            </Link>
          </div>
        </div>

        {/* Core Onboarding & Center Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Onboarding Checklist Card */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-3xl p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Onboarding Checklist</h2>
                <p className="text-xs text-[#475569]">Steps required to initialize your clinical chart</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9]">
                <div className="w-6 h-6 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B2A55]">1. Account Registration Complete</p>
                  <p className="text-xs text-[#475569] mt-0.5">Portal credentials and security profile created.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/30">
                <div className="w-6 h-6 rounded-full bg-[#0891B2] text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-bold text-[#0B2A55]">2. Schedule First Consultation</p>
                  <p className="text-xs text-[#475569]">Book an initial consultation to meet your primary care doctor.</p>
                  <Link
                    href="/#booking-section"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] transition-all shadow-sm"
                  >
                    Select Doctor & Schedule <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] opacity-75">
                <div className="w-6 h-6 rounded-full bg-[#94A3B8]/20 text-[#94A3B8] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B2A55]">3. Clinical Vitals Intake</p>
                  <p className="text-xs text-[#475569] mt-0.5">Vitals and medical history recorded during consultation.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] opacity-75">
                <div className="w-6 h-6 rounded-full bg-[#94A3B8]/20 text-[#94A3B8] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B2A55]">4. Full Records & Prescriptions Access</p>
                  <p className="text-xs text-[#475569] mt-0.5">Unlock lab diagnostics, e-prescriptions, and direct messaging.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clinic Contact Info Card */}
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-3xl p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">MediSynx Health Center</h2>
                <p className="text-xs text-[#475569]">Clinic Contact & Hours</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
                <MapPin className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B2A55]">Clinical Location</p>
                  <p className="text-[#475569] mt-0.5 leading-relaxed">
                    100 MediSynx Plaza, Suite 400<br />
                    New York, NY 10001
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
                <Phone className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B2A55]">Phone & Support</p>
                  <p className="text-[#475569] mt-0.5 leading-relaxed">
                    Main Office: +1 (800) 555-SYNX<br />
                    24/7 Patient Helpdesk: Available Online
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]">
                <Clock className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B2A55]">Operating Hours</p>
                  <p className="text-[#475569] mt-0.5 leading-relaxed">
                    Mon – Fri: 8:00 AM – 6:00 PM<br />
                    Saturday: 9:00 AM – 2:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Team Showcase */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="font-cambria text-xl font-bold text-[#0B2A55]">Our Board-Certified Specialists</h2>
              <p className="text-xs text-[#475569] mt-0.5">Doctors available for outpatient consultations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {doctors?.map((doc: any) => (
              <div key={doc.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:border-[#14B8A6] transition-all space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center shrink-0">
                    {doc.avatar_url ? (
                      <img src={doc.avatar_url} alt={`Dr. ${doc.last_name}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-cambria text-sm font-bold text-[#0891B2]">{doc.first_name[0]}{doc.last_name[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-cambria font-bold text-sm text-[#0B2A55]">Dr. {doc.first_name} {doc.last_name}</p>
                    <p className="text-xs font-semibold text-[#0891B2]">{doc.specialty || 'General Practitioner'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#16A34A] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" /> Available
                  </span>
                  <Link
                    href="/#booking-section"
                    className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1"
                  >
                    Book Visit <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── LINKED PATIENT CLINICAL DASHBOARD ───────────────────────────── */
  const [
    { data: upcomingAppts },
    { data: recentNotes },
    { data: recentLabs },
    { data: activeMeds },
    { data: unreadMessages },
  ] = await Promise.all([
    adminSupabase.from('appointments').select('*, provider:profiles!appointments_provider_id_fkey(first_name, last_name, specialty)')
      .eq('patient_id', patient.id).gte('scheduled_at', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed']).order('scheduled_at').limit(3),
    adminSupabase.from('clinical_notes').select('*, provider:profiles(first_name, last_name)')
      .eq('patient_id', patient.id).eq('status', 'signed').order('signed_at', { ascending: false }).limit(3),
    adminSupabase.from('lab_results').select('*, lab_order:lab_orders(test_name)')
      .eq('patient_id', patient.id).order('resulted_at', { ascending: false }).limit(5),
    adminSupabase.from('prescriptions').select('*').eq('patient_id', patient.id).eq('status', 'active').limit(5),
    supabase.from('messages').select('id').eq('recipient_id', user.id).is('read_at', null),
  ]);

  const isSuccess = searchParams?.booking_success === 'true';

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {isSuccess && (
        <div className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] text-sm font-medium shadow-sm animate-slide-up">
          <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
          <div>
            <p className="font-bold text-[#16A34A]">Appointment Confirmed!</p>
            <p className="text-xs text-[#475569] mt-0.5">
              Your consultation has been booked and confirmed successfully! Check details in your upcoming appointments schedule.
            </p>
          </div>
        </div>
      )}

      {/* Patient Hero Banner — Navy to Cyan Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B2A55] via-[#0F766E] to-[#0891B2] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#0891B2]/30">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-[#22D3EE] backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" /> Verified Patient Record
            </span>
            <h1 className="font-cambria text-3xl sm:text-4xl font-bold leading-tight">
              Welcome back, {patient.first_name} {patient.last_name}!
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/20 font-mono font-bold">
                MRN: {patient.mrn ?? '—'}
              </span>
              <span>DOB: {formatDate(patient.date_of_birth)}</span>
              <span>Gender: {patient.gender ? patient.gender.toUpperCase() : 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/#booking-section"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0B2A55] font-bold text-xs hover:bg-[#F8FAFC] transition-all shadow-md"
            >
              <Calendar className="w-4 h-4 text-[#0891B2]" /> Book Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Tiles Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/portal/appointments', label: 'Appointments', icon: Calendar, count: upcomingAppts?.length ?? 0, color: 'text-[#0891B2]', bg: 'bg-white border-[#E2E8F0] hover:border-[#0891B2]' },
          { href: '/portal/labs', label: 'Lab Results', icon: FlaskConical, count: recentLabs?.filter((l: any) => l.flag !== 'normal').length ?? 0, color: 'text-[#4CAF50]', bg: 'bg-white border-[#E2E8F0] hover:border-[#4CAF50]' },
          { href: '/portal/medications', label: 'Medications', icon: Pill, count: activeMeds?.length ?? 0, color: 'text-[#14B8A6]', bg: 'bg-white border-[#E2E8F0] hover:border-[#14B8A6]' },
          { href: '/portal/messages', label: 'Messages', icon: MessageSquare, count: unreadMessages?.length ?? 0, color: 'text-[#0B2A55]', bg: 'bg-white border-[#E2E8F0] hover:border-[#0B2A55]' },
        ].map(({ href, label, icon: Icon, count, color, bg }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'p-5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group',
              bg
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              {count > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0891B2]/10 text-[#0891B2]">
                  {count}
                </span>
              )}
            </div>
            <div>
              <p className="font-cambria font-bold text-sm text-[#0B2A55]">{label}</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Explore {label.toLowerCase()}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid: Schedule & Lab Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Upcoming Appointments Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Upcoming Appointments</h2>
                <p className="text-xs text-[#475569]">Scheduled outpatient & telehealth visits</p>
              </div>
            </div>
            <Link href="/portal/appointments" className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppts?.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9] hover:border-[#0891B2] transition-all">
                <div className="text-center min-w-[56px] rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 py-2">
                  <p className="text-base font-bold text-[#0891B2]">{formatDate(a.scheduled_at, 'd')}</p>
                  <p className="text-[10px] font-bold text-[#0891B2] uppercase">{formatDate(a.scheduled_at, 'MMM')}</p>
                </div>
                <div className="flex-1">
                  <p className="font-cambria font-bold text-sm text-[#0B2A55]">{a.chief_complaint ?? 'General Consultation'}</p>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Dr. {(a.provider as any)?.first_name} {(a.provider as any)?.last_name} · {formatDate(a.scheduled_at, 'h:mm a')}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold border border-[#16A34A]/20 uppercase">
                  {a.status}
                </span>
              </div>
            ))}
            {!upcomingAppts?.length && (
              <div className="text-center py-8 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-2xl">
                <p className="text-xs text-[#94A3B8]">No upcoming appointments scheduled</p>
                <Link href="/#booking-section" className="text-xs font-bold text-[#0891B2] hover:underline mt-2 inline-block">
                  + Book an appointment now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Lab Results Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50]">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Recent Lab Diagnostics</h2>
                <p className="text-xs text-[#475569]">Clinical laboratory test results</p>
              </div>
            </div>
            <Link href="/portal/labs" className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentLabs?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9]">
                <div>
                  <p className="font-cambria font-bold text-sm text-[#0B2A55]">{r.component_name}</p>
                  <p className="text-xs text-[#475569] mt-0.5">
                    {(r.lab_order as any)?.test_name} · {formatDate(r.resulted_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('font-mono text-sm font-bold', LAB_FLAG_COLORS[r.flag as LabResultFlag])}>
                    {r.value} {r.unit}
                  </p>
                  {r.flag !== 'normal' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold uppercase mt-1 inline-block">
                      {r.flag.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!recentLabs?.length && (
              <div className="text-center py-8 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-2xl">
                <p className="text-xs text-[#94A3B8]">No lab results on file yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Personal Profile Information Card */}
      <div id="my-profile-section" className="bg-white border border-[#E2E8F0] rounded-3xl p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#0B2A55]/10 border border-[#0B2A55]/20 flex items-center justify-center text-[#0B2A55]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Personal Profile & Password</h2>
            <p className="text-xs text-[#475569]">Your record details on file · Change password</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Details */}
          <div className="space-y-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-6">
            <h3 className="font-cambria font-bold text-sm text-[#0B2A55] border-b border-[#E2E8F0] pb-2">
              Patient Data
            </h3>
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-[#94A3B8] font-medium">Full Name</dt>
                <dd className="font-bold text-[#0F172A] mt-0.5">{patient.first_name} {patient.last_name}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8] font-medium">Medical Record No.</dt>
                <dd className="font-mono font-bold text-[#0891B2] mt-0.5">{patient.mrn ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8] font-medium">Date of Birth</dt>
                <dd className="font-bold text-[#0F172A] mt-0.5">{formatDate(patient.date_of_birth)}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8] font-medium">Email Address</dt>
                <dd className="font-semibold text-[#0F172A] mt-0.5 break-all">{patient.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8] font-medium">Phone Number</dt>
                <dd className="font-semibold text-[#0F172A] mt-0.5">{patient.phone ?? '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Change Password */}
          <div className="space-y-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-6">
            <h3 className="font-cambria font-bold text-sm text-[#0B2A55] border-b border-[#E2E8F0] pb-2">
              Update Account Password
            </h3>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
