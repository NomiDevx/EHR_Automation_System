import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatDateTime, LAB_FLAG_COLORS } from '@/lib/utils';
import { 
  Calendar, FlaskConical, Pill, MessageSquare, FileText, 
  ChevronRight, HeartPulse, CheckCircle2, UserCheck, 
  Stethoscope, Phone, Clock, MapPin, ArrowRight, Activity
} from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { LabResultFlag } from '@/lib/types/database';

export const metadata: Metadata = { title: 'My Health Portal' };

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Admin client — used to bypass RLS for patient data reads
  // (patient records created via public booking may have profile_id linked
  // after the row was created, causing is_own_patient_record() to return false)
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

  if (!patient) {
    // Guard: if profile is missing, force re-login
    if (!profile) redirect('/login');

    // Fetch active doctors using admin client
    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    return (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        {/* Welcome Header */}
        <div className="card bg-gradient-to-r from-blue-600/20 to-blue-800/10 border-blue-500/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Welcome, {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Your portal registration is active. Complete your clinical onboarding checklist to activate your medical chart.
              </p>
            </div>
            <HeartPulse className="w-10 h-10 text-blue-400 opacity-60 shrink-0" />
          </div>
        </div>

        {/* Core Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Onboarding checklist card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[hsl(var(--border-muted))] pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Onboarding Progress</h2>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Steps to initialize your medical record</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5 border border-emerald-500/25 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Account Registered</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Portal credentials created successfully.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mt-0.5 border border-blue-500/25 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Schedule Onboarding Consultation</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-2">Book your initial visit to meet your doctor and set up your clinical chart.</p>
                  <Link
                    href="/portal/appointments"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:bg-[hsl(220,55%,28%)] transition-all shadow-sm cursor-pointer"
                  >
                    Schedule Now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 opacity-55">
                <div className="w-5 h-5 rounded-full bg-gray-500/10 text-gray-400 flex items-center justify-center mt-0.5 border border-gray-500/20 shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Clinical Vitals & Intake</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Meet clinical staff to record histories, allergies, and vitals.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 opacity-55">
                <div className="w-5 h-5 rounded-full bg-gray-500/10 text-gray-400 flex items-center justify-center mt-0.5 border border-gray-500/20 shrink-0">
                  <HeartPulse className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Portal Fully Activated</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Access prescriptions, check labs, and message care team.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact and clinic info card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[hsl(var(--border-muted))] pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Stethoscope className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">MediCore Health Center</h2>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Clinic Information & Hours</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">Clinic Address</p>
                  <p className="text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                    100 Medical Center Parkway, Suite 500<br />
                    Boston, MA 02118
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">Phone & Support</p>
                  <p className="text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                    Main Office: (555) 019-2834<br />
                    Emergency: Call 911 (24/7 Help Desk)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">Hours of Operation</p>
                  <p className="text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                    Mon – Fri: 8:00 AM – 6:00 PM<br />
                    Saturday: 9:00 AM – 1:00 PM (Urgent Care only)<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Care Team Section */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border-muted))] pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Meet Our Clinical Team</h3>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">Specialists currently accepting new patient onboarding</p>
            </div>
          </div>
          {doctors && doctors.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[hsl(var(--border))] rounded-xl">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No doctors listed at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {doctors?.map((doc: any) => (
                <div key={doc.id} className="card p-4 flex items-center gap-3.5 bg-[hsl(var(--surface))] border border-[hsl(var(--border))]/40 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    {doc.avatar_url ? (
                      <img src={doc.avatar_url} alt={`Dr. ${doc.last_name}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-blue-400">{doc.first_name[0]}{doc.last_name[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(var(--foreground))]">Dr. {doc.first_name} {doc.last_name}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{doc.specialty || 'General Practice'}</p>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Accepting Patients
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // Use adminSupabase for all patient clinical data — the user-scoped client
  // relies on is_own_patient_record() RLS which silently returns [] when
  // profile_id is not yet linked on the patients row.
  // patient.id was already verified via the profile_id lookup above.
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
