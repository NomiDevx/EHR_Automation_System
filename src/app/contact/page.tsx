import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { ContactFormClient } from '@/components/ContactFormClient';
import { Phone, Mail, MapPin, Clock, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: "Contact Us | MediSynx EHR",
  description: "Get in touch with MediSynx EHR. Find clinic address, telephone, support email, and operating hours.",
};

export default function ContactPage() {
  const contactDetails = [
    {
      title: 'Call Us Directly',
      description: 'Consult schedules, confirm bookings, or speak to reception.',
      info: '+1 (800) 555-SYNX',
      subInfo: 'Direct: +1 (555) 123-4567',
      icon: Phone,
    },
    {
      title: 'Email Support',
      description: 'General support, system logs feedback, or admin requests.',
      info: 'support@medisynxehr.com',
      subInfo: 'billing@medisynxehr.com',
      icon: Mail,
    },
    {
      title: 'Visit Our Center',
      description: 'Physical clinical outpatient space for patient check-ins.',
      info: '100 MediSynx Plaza, Suite 400',
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
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0891B2]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#14B8A6]/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Intro Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0891B2]/30 bg-[#0891B2]/10 text-xs font-bold text-[#0891B2] tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" /> Get In Touch
          </div>
          <h1 className="font-cambria text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0B2A55]">
            We Are Here To Help You
          </h1>
          <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Have questions about clinical scheduling, medical records, or telehealth services? Reach out to our dedicated MediSynx EHR care team.
          </p>
        </section>

        {/* Contact info grid & contact form */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Info cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <h2 className="font-cambria text-2xl font-bold text-[#0B2A55]">Contact Information</h2>
              <p className="text-xs text-[#475569] leading-relaxed">
                Connect with our team via email, phone, or visit us in person. Our patient coordinators are ready to assist.
              </p>
            </div>

            <div className="space-y-4">
              {contactDetails.map((detail, idx) => {
                const Icon = detail.icon;
                return (
                  <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-start gap-4 shadow-sm hover:border-[#0891B2] hover:shadow-md transition-all">
                    <div className="w-9 h-9 rounded-lg bg-[#0891B2]/10 text-[#0891B2] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <h3 className="font-cambria font-bold text-sm text-[#0B2A55]">{detail.title}</h3>
                      <p className="text-[#475569]">{detail.description}</p>
                      <p className="font-bold text-[#0891B2] mt-1">{detail.info}</p>
                      {detail.subInfo && <p className="text-[#64748B] font-medium">{detail.subInfo}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety Warning Card */}
            <div className="p-4 border border-amber-300/80 bg-amber-50/90 flex items-start gap-3 rounded-xl shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Medical Emergency Alert</p>
                <p className="leading-relaxed">
                  If you are experiencing a life-threatening medical emergency, do not use this form. Please call <strong>911</strong> or proceed to the nearest emergency department immediately.
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
