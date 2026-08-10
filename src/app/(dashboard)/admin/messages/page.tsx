import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getContactSubmissions } from '@/app/actions';
import { ContactMessagesClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Contact Messages & Inquiries | Admin Dashboard | MediSynx EHR',
};

export default async function AdminContactMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if ((profile as any)?.role !== 'admin') redirect('/login');

  const { submissions } = await getContactSubmissions();

  return <ContactMessagesClient initialSubmissions={submissions} />;
}
