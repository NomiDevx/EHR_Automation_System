import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserRole, Profile } from '@/lib/types/database';
import { PublicBookingClient } from '@/components/PublicBookingClient';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { HeroSlider } from '@/components/HeroSlider';
import { ProcessStepsWidget } from '@/components/ProcessStepsWidget';
import { DoctorShowcaseWidget } from '@/components/DoctorShowcaseWidget';
import { CustomLoader } from '@/components/ui/CustomLoader';
import {
  Activity, ShieldCheck, Video, Heart, HelpCircle,
  Check, CalendarDays, Clock, Award, ArrowRight,
  Star, Users, Building2, Sparkles, CheckCircle2, Lock,
} from 'lucide-react';

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
      badge: 'Preventive Care',
    },
    {
      number: '02',
      title: 'Specialized Cardiology',
      description: 'Advanced EKG diagnostics and treatment plans for cardiovascular health and stroke prevention.',
      icon: Activity,
      badge: 'Advanced EKG',
    },
    {
      number: '03',
      title: 'Pediatrics & Family Care',
      description: 'Dedicated pediatricians offering wellness assessments, growth tracking, and adolescent consultations.',
      icon: Award,
      badge: 'Family Health',
    },
    {
      number: '04',
      title: 'HD Telehealth Consults',
      description: 'Secure, high-definition virtual visits with our clinicians from the comfort of your home.',
      icon: Video,
      badge: 'Virtual Visit',
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
    { value: '15,000+', label: 'Patients Served', icon: Users },
    { value: '45+', label: 'Specialist Doctors', icon: Award },
    { value: '16 yrs', label: 'Clinical Excellence', icon: Building2 },
    { value: '4.9 ★', label: 'Patient Rating', icon: Star },
  ];

  const faqs = [
    {
      question: 'Do I need to sign up to book an appointment with MediSynx EHR?',
      answer: 'No. Guest patients can request consultations directly from the public booking widget on this page. Registering for a Patient Portal account allows you to access historical charts, lab results, and message your doctor.',
    },
    {
      question: 'How do I access my MediSynx Patient Portal account?',
      answer: 'After scheduling, or by clicking "Patient Portal" at the top, you can register with your details. If you already have credentials, click "Sign In" in the navigation to enter the secure dashboard.',
    },
    {
      question: 'What is a Medical Record Number (MRN)?',
      answer: 'An MRN is a unique identifier assigned to you in our EHR system. It helps staff check you in quickly on-site. When booking as a guest, your MRN is displayed on the confirmation screen — please keep a note of it.',
    },
    {
      question: 'Are online Telehealth consultations available?',
      answer: 'Yes. MediSynx EHR offers fully integrated virtual video visits. Select "Telehealth Consult" in the appointment form, and your doctor will send a secure link prior to your scheduled time.',
    },
  ];

  return (
    <MarketingLayout>
      {/* Fast Custom Initial Loader */}
      <CustomLoader message="Loading MediSynx EHR..." />

      {/* Background Cyan & Teal Glow Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#0891B2]/10 blur-[130px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#14B8A6]/10 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] rounded-full bg-[#4CAF50]/10 blur-[140px]" />
      </div>

      <div className="relative space-y-0">

        {/* ─── WIDGET 1: HERO & SLIDESHOW SECTION (FULL SCREEN) ────── */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
          <div className="max-w-7xl mx-auto w-full space-y-12">
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-4">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0891B2]/20 bg-[#0891B2]/10 text-[#0891B2] text-xs font-bold tracking-widest uppercase shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-pulse" />
                MediSynx EHR · Smart Records. Better Care.
              </div>

              {/* Cambria Headline */}
              <h1 className="font-cambria text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-[#0B2A55]">
                Excellence in Every{' '}
                <span className="relative inline-block text-[#0891B2]">
                  <span className="relative z-10">Consultation</span>
                  {/* Underline accent */}
                  <svg
                    aria-hidden
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9 Q75 2 150 7 Q225 12 298 5"
                      stroke="#14B8A6"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-xl text-[#475569] max-w-3xl mx-auto leading-relaxed font-normal">
                Book consultations directly with our specialized clinical team — no prior registration required. Experience next-generation electronic health records with total security and speed.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
                <a
                  href="#booking-section"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-sm font-semibold tracking-wide shadow-md hover:shadow-lg hover:opacity-95 transition-all duration-200"
                >
                  Book Appointment Now
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#process-section"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl border border-[#0891B2] text-[#0891B2] bg-white text-sm font-semibold tracking-wide hover:bg-[#F8FAFC] transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#0891B2]" />
                  See How It Works
                </a>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[#E2E8F0] max-w-4xl mx-auto">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center justify-center gap-3 text-left p-2">
                      <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 text-[#0891B2] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-cambria text-xl font-bold text-[#0B2A55] leading-none">{stat.value}</p>
                        <p className="text-xs text-[#475569] font-medium mt-1">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High-Performance Hero Slider */}
            <div className="w-full">
              <HeroSlider />
            </div>
          </div>
        </section>

        {/* ─── WIDGET 2: STEP-BY-STEP PROCESS SECTION (FULL SCREEN) ── */}
        <div id="process-section" className="scroll-mt-16">
          <ProcessStepsWidget />
        </div>

        {/* ─── WIDGET 3: CLINICAL DEPARTMENTS SECTION (FULL SCREEN) ─── */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto w-full space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">What We Offer</p>
              <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55] leading-snug">
                Clinical Departments & Care
              </h2>
              <p className="text-base text-[#475569]">
                Modern diagnostics and outpatient consultations across specialized clinical departments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((svc) => {
                const Icon = svc.icon;
                return (
                  <div
                    key={svc.number}
                    className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-6 hover:border-[#14B8A6] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Number & Badge */}
                      <div className="flex items-center justify-between">
                        <span className="font-cambria text-4xl font-extrabold text-[#0891B2]/20 group-hover:text-[#0891B2]/40 transition-colors">
                          {svc.number}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#0891B2]/10 text-[#0891B2]">
                          {svc.badge}
                        </span>
                      </div>

                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] flex items-center justify-center shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2">
                        <h3 className="font-cambria text-xl font-bold text-[#0B2A55] leading-snug">
                          {svc.title}
                        </h3>
                        <p className="text-sm text-[#475569] leading-relaxed">
                          {svc.description}
                        </p>
                      </div>
                    </div>

                    <a
                      href="#booking-section"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#0891B2] group-hover:gap-3 transition-all pt-4 border-t border-[#F1F5F9]"
                    >
                      Book Department <ArrowRight className="w-3.5 h-3.5" />
                    </a>

                    {/* Bottom Gradient Accent Line */}
                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#0B2A55] via-[#0891B2] to-[#4CAF50] group-hover:w-full transition-all duration-500 rounded-b-2xl" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── WIDGET 4: DOCTORS SHOWCASE WIDGET (FULL SCREEN) ─────── */}
        <DoctorShowcaseWidget doctors={activeDoctors} />

        {/* ─── WIDGET 5: WHY MEDISYNX EHR SECTION (FULL SCREEN) ────── */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left — Text Showcase */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Why Choose Us</p>
                <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55] leading-tight">
                  Smart Records.<br />Better Care.
                </h2>
              </div>

              <p className="text-base text-[#475569] leading-relaxed">
                MediSynx EHR merges modern digital electronic health records with outpatient clinical workflows — providing instant access to patient charts, telehealth links, and real-time care communication.
              </p>

              {/* Checklist */}
              <ul className="space-y-4">
                {[
                  'Certified Outpatient Clinical Standards',
                  'HIPAA-Compliant Encrypted Health Record Storage',
                  'Instant Online Guest Booking & Automated MRN Generation',
                  'Integrated HD Telehealth Consultations & Prescriptions',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3.5 text-sm text-[#0F172A]">
                    <div className="w-6 h-6 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 font-bold" />
                    </div>
                    <span className="font-medium text-[#0F172A] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#booking-section"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0B2A55] text-white font-semibold text-sm hover:bg-[#0891B2] transition-all shadow-md"
              >
                Schedule Specialist Consult <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Right — Feature Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-7 space-y-4 hover:border-[#14B8A6] hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-cambria text-lg font-bold text-[#0B2A55] mb-2">{item.title}</h4>
                      <p className="text-sm text-[#475569] leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── WIDGET 6: INSTANT PUBLIC BOOKING SECTION (FULL SCREEN) ─ */}
        <section id="booking-section" className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0] scroll-mt-16">
          <div className="max-w-7xl mx-auto w-full space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Online Reservation</p>
              <h2 className="font-cambria text-3xl sm:text-4xl font-bold text-[#0B2A55]">
                Book Your Consultation
              </h2>
              <p className="text-sm text-[#475569]">
                Select your preferred doctor, date, and consultation type below.
              </p>
            </div>

            <PublicBookingClient doctors={activeDoctors} />
          </div>
        </section>

        {/* ─── WIDGET 7: FAQ SECTION (FULL SCREEN) ─────────────────── */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto w-full space-y-12">
            <div className="text-center space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Have Questions?</p>
              <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55] flex items-center justify-center gap-3">
                <HelpCircle className="w-8 h-8 text-[#0891B2] shrink-0" />
                Frequently Asked Questions
              </h2>
              <p className="text-base text-[#475569]">
                Quick answers regarding MediSynx EHR booking, MRN check-in, and patient portal access.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-7 space-y-3 hover:border-[#14B8A6] transition-all shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-cambria text-sm font-bold text-[#0891B2] shrink-0 mt-0.5 w-6">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <div className="space-y-2">
                      <h4 className="font-cambria text-lg font-bold text-[#0B2A55] leading-snug">{faq.question}</h4>
                      <p className="text-sm text-[#475569] leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </MarketingLayout>
  );
}
