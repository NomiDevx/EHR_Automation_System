import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UnifiedMessagingClient, type MessagingContact } from '@/components/messaging/UnifiedMessagingClient';
import { MessageSquare, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'Messages | MediSynx EHR' };

export default async function PortalMessagesPage({
  searchParams,
}: {
  searchParams: { to?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase
    .from('patients')
    .select('id, primary_provider_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, role), recipient:profiles!messages_recipient_id_fkey(first_name, last_name, role)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const adminSupabase = createAdminClient();
  const { data: providers } = await adminSupabase
    .from('profiles')
    .select('id, first_name, last_name, specialty, role')
    .in('role', ['doctor', 'nurse'])
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  const contacts: MessagingContact[] = (providers ?? []).map((p: any) => ({
    id: p.id,
    name: `Dr. ${p.first_name} ${p.last_name}`,
    subTitle: p.specialty || 'General Practitioner',
    role: p.role,
    patientId: patient?.id ?? undefined,
  }));

  const defaultRecipientId = searchParams?.to || '';

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0B2A55]/10 text-[#0B2A55] border border-[#0B2A55]/20">
            <Sparkles className="w-3.5 h-3.5" /> Care Team Communications
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">Ask Doctor / Messages</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Select a physician from your care team to ask a question or discuss test results.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0B2A55]/10 border border-[#0B2A55]/20 flex items-center justify-center text-[#0B2A55] shrink-0">
          <MessageSquare className="w-6 h-6" />
        </div>
      </div>

      <UnifiedMessagingClient
        messages={messages ?? []}
        currentUserId={user.id}
        contacts={contacts}
        defaultRecipientId={defaultRecipientId}
        isStaff={false}
      />
    </div>
  );
}
