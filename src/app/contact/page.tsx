import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { ContactFormClient } from '@/components/ContactFormClient';
import { Phone, Mail, MapPin, Clock, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: "Contact Us | MediCore EHR",
  description: "Get in touch with the MediCore team. Find clinic address, telephone, support email, and operating hours.",
};

export default function ContactPage() {
  const contactDetails = [
    {
      title: 'Call Us Directly',
      description: 'Consult schedules, confirm bookings, or speak to reception.',
      info: '+1 (555) 123-4567',
      subInfo: 'Toll-free: +1 (800) 555-EHR1',
      icon: Phone,
    },
    {
      title: 'Email Support',
      description: 'General support, system logs feedback, or admin requests.',
      info: 'support@medicore-ehr.com',
      subInfo: 'billing@medicore-ehr.com',
      icon: Mail,
    },
    {
      title: 'Visit Our Center',
      description: 'Physical clinical outpatient space for patient check-ins.',
      info: '100 Medical Plaza, Suite 400',
      subInfo: 'New York, NY 10001',
      icon: MapPin,
    },
    {
      title: 'Clinic Hours',
      description: 'Active receptionist support and standard consultation slots.',
      info: 'Mon - Fri: 8:00 AM - 6:00 PM',
      subInfo: 'Sat: 9:00 AM - 2:00 PM (Urgent Care)',
      icon: Clock,
    },
  ];

  return (
    <MarketingLayout>
      {/* Background Decorators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Intro Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-500 dark:text-blue-300">
            💬 Get In Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))]">
            We Are Here To Help You
          </h1>
          <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Have questions about clinical scheduling, medical records, or user accounts? Reach out to our patient services team.
          </p>
        </section>

        {/* Contact info grid & contact form */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Info cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Contact Information</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Connect with our team via email, telephone, or visit us in person. Our patient coordinators are ready to assist.
              </p>
            </div>

            <div className="space-y-4">
              {contactDetails.map((detail, idx) => {
                const Icon = detail.icon;
                return (
                  <div key={idx} className="card p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <h4 className="font-bold text-[hsl(var(--foreground))]">{detail.title}</h4>
                      <p className="text-[hsl(var(--muted-foreground))]">{detail.description}</p>
                      <p className="font-semibold text-blue-500 mt-1">{detail.info}</p>
                      {detail.subInfo && <p className="text-[hsl(var(--muted-foreground))] font-medium">{detail.subInfo}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety Warning Card */}
            <div className="card p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300/95 space-y-1">
                <p className="font-bold">Medical Emergency Alert</p>
                <p className="leading-relaxed">
                  If you are experiencing a life-threatening health event, do not use this portal or contact form. Call <strong>911</strong> or go to your nearest emergency room immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <ContactFormClient />
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
