import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Award, Compass, Heart, ShieldCheck, Users, Sparkles } from 'lucide-react';

export const metadata = {
  title: "About Us | MediSynx EHR",
  description: "Learn about MediSynx EHR, our mission, vision, and core clinical standards for modern healthcare.",
};

export default function AboutPage() {
  const stats = [
    { label: 'Specialized Doctors', value: '50+' },
    { label: 'Patient Satisfaction', value: '99.8%' },
    { label: 'Care Departments', value: '15+' },
    { label: 'Appointments Booked', value: '15k+' },
  ];

  const values = [
    {
      title: 'Patient Centricity',
      description: 'Our primary focus is the well-being, comfort, and direct health recovery of every individual who walks through our doors.',
      icon: Heart,
    },
    {
      title: 'Clinical Excellence',
      description: 'We adhere to state-of-the-art standards in diagnostics, medical care, and continuous clinical updates.',
      icon: Award,
    },
    {
      title: 'Absolute Privacy',
      description: 'Strict security systems safeguard patient records, clinical communications, and private scheduling datasets.',
      icon: ShieldCheck,
    },
    {
      title: 'Compassionate Care',
      description: 'Beyond medical technology, our doctors, nurses, and receptionists lead with empathy and human-first care.',
      icon: Compass,
    },
  ];

  return (
    <MarketingLayout>
      {/* Background Decorators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#EDE9FE]/60 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#F1F5F9]/80 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Intro Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#EDE9FE] text-xs font-bold text-[#6D28D9]">
            <Sparkles className="w-3.5 h-3.5" /> About MediSynx EHR
          </div>
          <h1 className="font-cambria text-4xl sm:text-5xl font-bold tracking-tight text-[#111827]">
            Pioneering Modern Clinical Excellence
          </h1>
          <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
            At MediSynx EHR, we merge clinical excellence with modern digital convenience. Our Electronic Health Record (EHR) system gives you, and your physician, instant secure access to premium care.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center flex flex-col justify-center gap-1.5 shadow-sm">
              <span className="font-cambria text-3xl sm:text-4xl font-bold text-[#6D28D9]">
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
            <h2 className="font-cambria text-2xl sm:text-3xl font-bold text-[#111827]">
              Our Vision for Modern Medicine
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              We envision a future where patient scheduling, charting, and consulting flow seamlessly. By cutting away unnecessary paperwork and dashboard complexity, we allow clinicians to focus entirely on patient recovery.
            </p>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              Through constant clinical innovations and strict adherence to medical ethics, we provide top-tier outpatient diagnostics, care routines, and telehealth schedules.
            </p>
          </div>
          <div className="relative border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC] rounded-3xl p-8 overflow-hidden shadow-md">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] border border-[#8B5CF6]/20 text-[#6D28D9] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-cambria text-lg font-bold text-[#111827]">Our Healthcare Philosophy</h3>
              <blockquote className="text-sm italic text-[#475569] border-l-3 border-[#6D28D9] pl-4 py-1">
                &ldquo;Healthcare is a fundamental human right. At MediSynx EHR, we believe that providing first-class digital tools like booking portals and records retrieval is crucial to respecting that right.&rdquo;
              </blockquote>
              <p className="text-xs font-bold text-[#111827]">— Leadership Team, MediSynx EHR</p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-cambria text-2xl sm:text-3xl font-bold text-[#111827]">Our Core Clinical Values</h2>
            <p className="text-sm text-[#475569]">
              Every clinician and administrator at MediSynx EHR guides their daily practice with these principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div key={idx} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:border-[#8B5CF6] transition-all duration-200 space-y-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-cambria font-bold text-lg text-[#111827]">{v.title}</h3>
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
