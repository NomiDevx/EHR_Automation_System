import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserRole, Profile } from '@/lib/types/database';
import { PublicBookingClient } from '@/components/PublicBookingClient';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { HeroSlider } from '@/components/HeroSlider';
import {
  Activity, ShieldCheck, Video, Heart, HelpCircle,
  Check, CalendarDays, Clock, Award, ArrowRight,
  Star, Users, Building2,
} from 'lucide-react';
import Link from 'next/link';

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/clinical/patients',
  nurse: '/clinical/patients',
  receptionist: '/reception',
  patient: '/portal',
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    redirect(ROLE_HOME[((profile as any)?.role as UserRole) ?? 'patient']);
  }

  const adminSupabase = createAdminClient();
  const { data: doctors } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  const activeDoctors = (doctors ?? []) as Profile[];

  const services = [
    {
      number: '01',
      title: 'Primary Care & Prevention',
      description: 'Comprehensive annual check-ups, routine immunizations, screenings, and family health management.',
      icon: Heart,
    },
    {
      number: '02',
      title: 'Specialized Cardiology',
      description: 'Advanced EKG diagnostics and treatment plans for cardiovascular health and stroke prevention.',
      icon: Activity,
    },
    {
      number: '03',
      title: 'Pediatrics & Family Care',
      description: 'Dedicated pediatricians offering wellness assessments, growth tracking, and adolescent consultations.',
      icon: Award,
    },
    {
      number: '04',
      title: 'Telehealth Consults',
      description: 'Secure, high-definition virtual visits with our clinicians from the comfort of your home.',
      icon: Video,
    },
  ];

  const benefits = [
    {
      title: 'Board-Certified Clinicians',
      description: 'Every clinician carries years of dedicated outpatient and hospital care experience.',
      icon: Award,
    },
    {
      title: 'Encrypted Health Records',
      description: 'State-of-the-art protocols safeguard your clinical results, schedules, and charts.',
      icon: ShieldCheck,
    },
    {
      title: 'Instant Online Booking',
      description: 'Reserve appointments without prior credentials or waiting in phone queues.',
      icon: CalendarDays,
    },
    {
      title: '24/7 Patient Portal',
      description: 'Access records, message your provider, and manage billing any time from any device.',
      icon: Clock,
    },
  ];

  const stats = [
    { value: '12,000+', label: 'Patients Served', icon: Users },
    { value: '40+', label: 'Specialist Doctors', icon: Award },
    { value: '15 yrs', label: 'Clinical Excellence', icon: Building2 },
    { value: '4.9 ★', label: 'Patient Rating', icon: Star },
  ];

  const faqs = [
    {
      question: 'Do I need to sign up to book an appointment?',
      answer: 'No. Guest patients can request consultations directly from the public booking form on this page. Registering for a Patient Portal account allows you to access historical charts, lab results, and message your doctor.',
    },
    {
      question: 'How do I access my patient portal account?',
      answer: 'After scheduling, or by clicking "Patient Portal" at the top, you can register with your details. If you already have credentials, click "Sign In" in the navigation to enter the secure dashboard.',
    },
    {
      question: 'What is a Medical Record Number (MRN)?',
      answer: 'An MRN is a unique identifier assigned to you in our EHR system. It helps staff check you in quickly on-site. When booking as a guest, your MRN is displayed on the confirmation screen — please keep a note of it.',
    },
    {
      question: 'Are online Telehealth consultations available?',
      answer: 'Yes. We offer fully integrated virtual video visits. Select "Telehealth Consult" in the appointment form, and your doctor will send a secure link prior to your scheduled time.',
    },
  ];

  return (
    <MarketingLayout>

      {/* ── Subtle background grain/gradient ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary))]/5 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(var(--accent))]/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[hsl(var(--primary))]/4 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 py-16">

        {/* ─── HERO ─────────────────────────────────────────────────── */}
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-8">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/8 text-[hsl(var(--accent))] text-xs font-semibold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
            Trusted Medical Care · Est. 2009
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-700 leading-tight tracking-tight text-[hsl(var(--foreground))]">
            Excellence in Every{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Consultation</span>
              {/* Gold underline accent */}
              <svg
                aria-hidden
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9 Q75 2 150 7 Q225 12 298 5"
                  stroke="hsl(43,62%,48%)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
            Book consultations directly with our specialized clinical team — no registration required. Access secure health services, schedule specialists, and manage your care with confidence.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <a
              href="#booking-section"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold tracking-wide shadow-lg hover:shadow-[hsl(var(--primary))]/30 hover:bg-[hsl(220,55%,28%)] transition-all duration-200"
            >
              Book Appointment
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/signup">
              <span className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[hsl(var(--accent))]/50 text-[hsl(var(--foreground))] text-sm font-semibold tracking-wide hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/8 transition-all duration-200 cursor-pointer">
                Access Patient Portal
              </span>
            </Link>
          </div>

          {/* Trust stats bar */}
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 pt-4 border-t border-[hsl(var(--border))]/60">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2.5 text-left">
                  <Icon className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <div>
                    <p className="font-display text-lg font-semibold text-[hsl(var(--foreground))] leading-none">{stat.value}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── HERO SLIDER ─────────────────────────────────────────── */}
        <HeroSlider />

        {/* ─── SERVICES ────────────────────────────────────────────── */}
        <section className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            {/* Section label */}
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">What We Offer</p>
            <h2 className="font-display text-3xl sm:text-4xl font-600 text-[hsl(var(--foreground))] leading-snug">
              Clinical Departments & Care
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              Modern diagnostics and outpatient consultations across several specialized clinical departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.number}
                  className="group relative bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-7 space-y-5 hover:border-[hsl(var(--accent))]/40 hover:shadow-lg transition-all duration-300"
                >
                  {/* Number — large ghost */}
                  <span className="font-display text-5xl font-700 text-[hsl(var(--accent))]/12 group-hover:text-[hsl(var(--accent))]/20 transition-colors leading-none select-none">
                    {svc.number}
                  </span>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-[hsl(var(--primary))]/8 border border-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-base font-semibold text-[hsl(var(--foreground))] leading-snug">{svc.title}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{svc.description}</p>
                  </div>

                  {/* Hover gold bottom line */}
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-[hsl(var(--accent))] to-transparent group-hover:w-full transition-all duration-500 rounded-b-2xl" />
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── WHY CHOOSE US ───────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
          {/* Left — editorial text */}
          <div className="lg:col-span-5 space-y-7">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Why MediCore</p>
            <h2 className="font-display text-3xl sm:text-4xl font-600 text-[hsl(var(--foreground))] leading-snug">
              Better Technology.<br />Better Care.
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed max-w-md">
              MediCore merges state-of-the-art Electronic Health Records with outpatient medical practices — giving you digital support for diagnostic reports, billing, and real-time communication with your care team.
            </p>

            {/* Checklist */}
            <ul className="space-y-3 pt-1">
              {[
                'Certified Outpatient Clinical Standards',
                'Encrypted Patient Data Safety (HIPAA Compatible)',
                'Instant Consultation Confirmation & Logs',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[hsl(var(--foreground))]">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="#booking-section"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--accent))] hover:gap-3 transition-all duration-200"
            >
              Schedule a Consultation <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right — benefit cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-6 space-y-4 hover:border-[hsl(var(--border-muted))] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/8 border border-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">{item.title}</h4>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── BOOKING SECTION ─────────────────────────────────────── */}
        <section id="booking-section" className="scroll-mt-24 space-y-6">
          <PublicBookingClient doctors={activeDoctors} />
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────── */}
        <section className="space-y-10 max-w-3xl mx-auto">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Have Questions?</p>
            <h2 className="font-display text-3xl sm:text-4xl font-600 text-[hsl(var(--foreground))] flex items-center justify-center gap-3">
              <HelpCircle className="w-7 h-7 text-[hsl(var(--accent))]/60 shrink-0" />
              Frequently Asked
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Answers to common questions about clinic booking and patient portal access.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-6 space-y-2 hover:border-[hsl(var(--accent))]/25 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="font-display text-xs font-bold text-[hsl(var(--accent))]/60 mt-0.5 shrink-0 w-5">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <div className="space-y-2">
                    <h4 className="font-display text-sm font-semibold text-[hsl(var(--foreground))] leading-snug">{faq.question}</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </MarketingLayout>
  );
}
