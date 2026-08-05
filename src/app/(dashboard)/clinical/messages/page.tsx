import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UnifiedMessagingClient, type MessagingContact } from '@/components/messaging/UnifiedMessagingClient';
import { MessageSquare, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'Patient Messages | MediSynx EHR' };

export default async function ClinicalMessagesPage({
  searchParams,
}: {
  searchParams: { to?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !['admin', 'doctor', 'nurse'].includes(profile.role)) {
    redirect('/login');
  }

  // Fetch messages involving current staff user
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, role), recipient:profiles!messages_recipient_id_fkey(first_name, last_name, role), patient:patients(id, first_name, last_name, mrn)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Fetch list of patients so clinician can message them
  const adminSupabase = createAdminClient();
  const { data: patients } = await adminSupabase
    .from('patients')
    .select('id, first_name, last_name, mrn, profile_id')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  const contacts: MessagingContact[] = (patients ?? [])
    .filter((p: any) => p.profile_id)
    .map((p: any) => ({
      id: p.profile_id,
      name: `${p.first_name} ${p.last_name}`,
      subTitle: `MRN: ${p.mrn ?? 'N/A'}`,
      role: 'patient',
      patientId: p.id,
    }));

  const defaultRecipientId = searchParams?.to || '';

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5" /> Patient Messaging Console
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">Clinical Patient Messages</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Respond to patient inquiries, medical questions, and care follow-ups.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
          <MessageSquare className="w-6 h-6" />
        </div>
      </div>

      <UnifiedMessagingClient
        messages={messages ?? []}
        currentUserId={user.id}
        contacts={contacts}
        defaultRecipientId={defaultRecipientId}
        isStaff={true}
      />
    </div>
  );
}
