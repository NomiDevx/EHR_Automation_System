import type { Metadata } from 'next';
import { AppointmentChatClient } from '@/components/chat/AppointmentChatClient';

export const metadata: Metadata = {
  title: 'AI Booking Assistant | MediCore EHR',
  description: 'Schedule, reschedule, or manage your appointment by chat or voice.',
};

export default function DashboardAssistantPage() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[hsl(var(--border))] pb-3 sm:pb-4">
        <div>
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-blue-400">
            AI Voice & Chat Assistant
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[hsl(var(--foreground))] mt-0.5">
            Book or Manage Appointment
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Schedule, reschedule, or cancel your medical visit with our AI assistant.
          </p>
        </div>
      </div>

      <AppointmentChatClient />
    </div>
  );
}
