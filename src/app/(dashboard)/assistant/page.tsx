import type { Metadata } from 'next';
import { AppointmentChatClient } from '@/components/chat/AppointmentChatClient';
import { Bot, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Booking Assistant | MediSynx EHR',
  description: 'Schedule, reschedule, or manage your appointment by chat or voice.',
};

export default function DashboardAssistantPage() {
  return (
    <div className="space-y-6 pb-16 sm:pb-0 max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" /> AI Voice & Chat Assistant
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">
            Book or Manage Appointment
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Schedule, reschedule, or inquire about medical visits using natural conversation or voice commands.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
          <Bot className="w-6 h-6" />
        </div>
      </div>

      <AppointmentChatClient />
    </div>
  );
}
