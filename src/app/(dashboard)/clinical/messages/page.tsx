import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClinicalMessagesClient } from './client';

export const metadata: Metadata = { title: 'Patient Messages' };

export default async function ClinicalMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !['admin', 'doctor', 'nurse'].includes(profile.role)) {
    redirect('/login');
  }

  // Fetch messages involving the current staff user
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, role), recipient:profiles!messages_recipient_id_fkey(first_name, last_name, role), patient:patients(id, first_name, last_name, mrn)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Fetch list of patients so the clinician can choose who to message
  const adminSupabase = createAdminClient();
  const { data: patients } = await adminSupabase
    .from('patients')
    .select('id, first_name, last_name, mrn, profile_id')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Patient Messages</h1>
      <ClinicalMessagesClient
        messages={messages ?? []}
        currentUserId={user.id}
        patients={patients ?? []}
      />
    </div>
  );
}
