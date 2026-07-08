import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessagesClient } from './client';

export const metadata: Metadata = { title: 'Messages' };

export default async function PortalMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: patient } = await supabase.from('patients').select('id, primary_provider_id').eq('profile_id', user.id).single();

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, role), recipient:profiles!messages_recipient_id_fkey(first_name, last_name, role)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Use admin client to bypass profiles RLS select restriction for patients
  const adminSupabase = createAdminClient();
  const { data: providers } = await adminSupabase
    .from('profiles')
    .select('id, first_name, last_name, specialty')
    .in('role', ['doctor', 'nurse'])
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Messages</h1>
      <MessagesClient
        messages={messages ?? []}
        currentUserId={user.id}
        providers={providers ?? []}
        patientId={patient?.id ?? null}
      />
    </div>
  );
}
