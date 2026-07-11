import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { EditUserClient } from './EditUserClient';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', params.id)
    .single();

  if (!profile) return { title: 'User Not Found | Admin' };

  return {
    title: `Edit ${profile.first_name} ${profile.last_name} | Admin`,
  };
}

export default async function EditUserPage({ params }: Props) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) {
    notFound();
  }

  return <EditUserClient profile={profile} />;
}
