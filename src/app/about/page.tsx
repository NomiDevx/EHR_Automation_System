import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Award, Compass, Heart, ShieldCheck, Users } from 'lucide-react';

export const metadata = {
  title: "About Us | MediCore EHR",
  description: "Learn about MediCore Healthcare, our mission, vision, and core clinical standards for modern medical practices.",
};

export default function AboutPage() {
  const stats = [
    { label: 'Specialized Doctors', value: '50+' },
    { label: 'Patient Satisfaction', value: '99.8%' },
    { label: 'Care Departments', value: '15+' },
    { label: 'Appointments Booked', value: '12k+' },
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
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Intro Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-500 dark:text-blue-300">
            🌟 About MediCore
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))]">
            Pioneering Modern Clinical Excellence
          </h1>
          <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            At MediCore Healthcare, we merge clinical excellence with modern digital convenience. Our Electronic Health Record (EHR) system gives you, and your physician, instant secure access to premium care.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="card text-center p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl flex flex-col justify-center gap-1.5 shadow-sm">
              <span className="text-3xl sm:text-4xl font-extrabold text-[hsl(var(--primary))]">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        {/* Mission and Vision Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">
              Our Vision for Modern Medicine
            </h2>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
              We envision a future where patient scheduling, charting, and consulting flow seamlessly. By cutting away unnecessary paperwork and dashboard complexity, we allow clinicians to do what they do best: focus entirely on the patient.
            </p>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
              Through constant clinical innovations and strict adherence to medical ethics, we provide top-tier outpatient diagnostics, care routines, and post-visit counseling schedules.
            </p>
          </div>
          <div className="relative border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--surface-hover))] rounded-3xl p-8 overflow-hidden shadow-glow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Our Healthcare Philosophy</h3>
              <blockquote className="text-sm italic text-[hsl(var(--muted-foreground))] border-l-2 border-blue-500 pl-4 py-1">
                &ldquo;Healthcare is a fundamental human right. At MediCore, we believe that providing first-class digital tools like booking portals and records retrieval is crucial to respecting that right.&rdquo;
              </blockquote>
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">— Board of Directors, MediCore Healthcare</p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Our Core Clinical Values</h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              Every clinician and administrator at MediCore guides their daily practice with these principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div key={idx} className="card p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl hover:border-blue-500/30 transition-all duration-200 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[hsl(var(--foreground))]">{v.title}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
