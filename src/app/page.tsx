import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserRole, Profile } from '@/lib/types/database';
import { PublicBookingClient } from '@/components/PublicBookingClient';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { HeroSlider } from '@/components/HeroSlider';
import { Activity, ShieldCheck, Video, Heart, HelpCircle, Check, CalendarDays, Clock, Award } from 'lucide-react';
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

  // Redirect logged in users to their workspace dashboards
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    redirect(ROLE_HOME[((profile as any)?.role as UserRole) ?? 'patient']);
  }

  // Fetch doctors list using service-role client (to bypass RLS for public visitor)
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
      title: 'Primary Care & Prevention',
      description: 'Comprehensive annual check-ups, routine immunizations, screenings, and family health management programs.',
      icon: Heart,
    },
    {
      title: 'Specialized Cardiology',
      description: 'Advanced screening, EKG diagnostics, and treatment plans for cardiovascular health and stroke prevention.',
      icon: Activity,
    },
    {
      title: 'Pediatrics & Care',
      description: 'Dedicated pediatricians offering children\'s wellness assessments, growth tracking, and adolescent consultations.',
      icon: Award,
    },
    {
      title: 'Telehealth Consults',
      description: 'Secure, high-definition online virtual visits with clinical professionals directly from the comfort of your home.',
      icon: Video,
    },
  ];

  const benefits = [
    {
      title: 'Certified Professionals',
      description: 'All our clinicians are board-certified, bringing years of dedicated hospital and outpatient care experience.',
      icon: Award,
    },
    {
      title: 'Secure Health Records',
      description: 'Equipped with state-of-the-art encryption protocols to safeguard clinical results, schedules, and charts.',
      icon: ShieldCheck,
    },
    {
      title: 'Immediate Access',
      description: 'Apply for appointments instantly online without needing prior portal credentials or phone queues.',
      icon: CalendarDays,
    },
    {
      title: '24/7 Patient Support',
      description: 'Access patient records, message providers, and manage bills any time through our patient portal.',
      icon: Clock,
    },
  ];

  const faqs = [
    {
      question: 'Do I need to sign up to book an appointment?',
      answer: 'No, you do not. Guest patients can request consultations directly from the public booking form on this screen. However, registering for a Patient Portal account allows you to view historical charts, access lab results, and message your doctor directly.',
    },
    {
      question: 'How do I access my patient portal account?',
      answer: 'After scheduling an appointment, or by clicking "Patient Portal" at the top, you can register using your details. If you have credentials, click "Sign In" in the navigation bar to enter the secure dashboard.',
    },
    {
      question: 'What is a Medical Record Number (MRN)?',
      answer: 'A Medical Record Number (MRN) is a unique identifier assigned to you in our EHR system. It helps receptionist staff check you in quickly on-site. When booking a guest appointment, your MRN is displayed on the success screen; please keep a note of it.',
    },
    {
      question: 'Are online consultations (Telehealth) available?',
      answer: 'Yes! We offer fully integrated virtual video visits. Simply select the "Telehealth Consult" visit type in the appointment form, and your doctor will send a secure link prior to your scheduled time.',
    },
  ];

  return (
    <MarketingLayout>
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-500 dark:text-blue-300">
            🏥 Professional Medical EHR & Consultations
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))]">
            Secure, Instant Healthcare Access
          </h1>
          <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Book consultations directly with our specialized clinical team without needing to register. Access secure health services and check your schedules.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <a href="#booking-section" className="btn btn-primary px-6 py-2.5 font-medium shadow-lg hover:shadow-blue-500/20">
              Book Appointment Now
            </a>
            <Link href="/signup">
              <span className="btn btn-secondary px-6 py-2.5 font-medium cursor-pointer">
                Access Patient Portal
              </span>
            </Link>
          </div>
        </section>

        <HeroSlider />

        {/* Clinical Services Section */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))]">Clinical Departments & Care</h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              We offer modern diagnostics and general outpatient consultations across several specialized clinics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div key={idx} className="card p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl hover:border-blue-500/30 transition-all duration-200 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[hsl(var(--foreground))]">{svc.title}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{svc.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))]">
              Providing Better Technology For Better Care
            </h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              MediCore merges state-of-the-art Electronic Health Records operations with outpatient medical practices, giving you digital support for diagnostic reports, billing details, and live messages with clinical personnel.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[hsl(var(--foreground))]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <span>Certified Outpatient Clinical Standards</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[hsl(var(--foreground))]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <span>Encrypted Patient Data Safety (HIPAA Compatible)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[hsl(var(--foreground))]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <span>Instant Consultation Confirmation Logs</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="card p-5 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="font-bold text-sm text-[hsl(var(--foreground))]">{item.title}</h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Doctors Section Anchor */}
        <section id="doctors-section" className="scroll-mt-20 space-y-6">
          {/* Public Booking client logic (handles doctors list + schedule form) */}
          <PublicBookingClient doctors={activeDoctors} />
        </section>

        {/* FAQs Section */}
        <section className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))] flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-500 shrink-0" /> Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              Find fast answers to common questions about clinic booking and patient portal access.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card p-5 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-[hsl(var(--foreground))]">{faq.question}</h4>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
