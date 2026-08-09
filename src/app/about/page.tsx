import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Award, Compass, Heart, ShieldCheck, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: "About Us | MediSynx EHR",
  description: "Learn about MediSynx EHR, our mission, vision, and core clinical standards for modern healthcare.",
};

export default function AboutPage() {
  const stats = [
    { label: 'Specialized Doctors', value: '50+' },
    { label: 'Patient Satisfaction', value: '99.8%' },
    { label: 'Care Departments', value: '15+' },
    { label: 'Appointments Booked', value: '15,000+' },
  ];

  const values = [
    {
      title: 'Patient-Centric Care',
      description: 'Our primary focus is the health, comfort, and seamless clinical recovery of every patient through fast digital tools.',
      icon: Heart,
    },
    {
      title: 'Clinical Excellence',
      description: 'We adhere to state-of-the-art standards in medical diagnostics, EHR charting, and evidence-based practice.',
      icon: Award,
    },
    {
      title: 'HIPAA Data Privacy',
      description: 'Bank-grade 256-bit encryption safeguards all electronic records, consultations, and private patient datasets.',
      icon: ShieldCheck,
    },
    {
      title: 'Compassionate Care',
      description: 'Beyond advanced healthcare tech, our physicians, nurses, and staff lead with human-first empathy.',
      icon: Compass,
    },
  ];

  return (
    <MarketingLayout>
      {/* Background Decorators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0891B2]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#14B8A6]/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Intro Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0891B2]/30 bg-[#0891B2]/10 text-xs font-bold text-[#0891B2] tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" /> About MediSynx EHR
          </div>
          <h1 className="font-cambria text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0B2A55]">
            Pioneering Modern Clinical Excellence
          </h1>
          <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
            At MediSynx EHR, we merge clinical precision with digital convenience. Our Electronic Health Record system empowers patients and clinicians with instant, encrypted access to world-class healthcare.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center flex flex-col justify-center gap-1.5 shadow-md shadow-[#0B2A55]/5 hover:border-[#0891B2]/50 transition-all">
              <span className="font-cambria text-3xl sm:text-4xl font-extrabold text-[#0891B2]">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        {/* Mission and Vision Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">
              Our Vision for Next-Gen Healthcare
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              We envision a modern healthcare ecosystem where scheduling, patient charting, and HD video consultations happen effortlessly. By eliminating administrative friction, we enable doctors to dedicate 100% of their time to patient care.
            </p>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              With integrated telehealth, AI-assisted summaries, and automated appointment reminders, MediSynx EHR is built for the future of clinical practice.
            </p>

            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0B2A55]">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#0891B2]" /> 256-bit AES &amp; TLS 1.3 Encrypted Patient Records
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0B2A55]">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#0891B2]" /> Instant Online Booking &amp; Telehealth Video Visits
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0B2A55]">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#0891B2]" /> Complete HIPAA &amp; ISO 27001 Compliance
              </div>
            </div>
          </div>

          <div className="relative border border-[#E2E8F0] bg-gradient-to-br from-white to-[#F1F5F9] rounded-3xl p-8 overflow-hidden shadow-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">Our Healthcare Philosophy</h3>
              <blockquote className="text-sm italic text-[#475569] border-l-4 border-[#0891B2] pl-4 py-1">
                &ldquo;Healthcare is a fundamental human right. At MediSynx EHR, we believe that delivering smart, intuitive digital tools like self-service scheduling and patient portals is essential to respecting that right.&rdquo;
              </blockquote>
              <p className="text-xs font-bold text-[#0B2A55]">— Executive Leadership Team, MediSynx EHR</p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">Our Core Clinical Pillars</h2>
            <p className="text-sm text-[#475569]">
              Every physician, nurse, and software engineer at MediSynx EHR guides their daily work with these principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div key={idx} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:border-[#0891B2] hover:shadow-lg transition-all duration-200 space-y-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 text-[#0891B2] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-cambria font-bold text-lg text-[#0B2A55]">{v.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
