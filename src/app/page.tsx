import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserRole, Profile } from '@/lib/types/database';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { HomeClient } from '@/components/HomeClient';

export const metadata: Metadata = {
  title: 'MediSynx EHR | Smart Records. Better Care. Healthcare Platform',
  description: 'Next-generation Electronic Health Records system with instant guest booking, HD Telehealth, and AI reception assistant.',
};

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/clinical/patients',
  nurse: '/clinical/patients',
  receptionist: '/reception',
  patient: '/portal',
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    redirect(ROLE_HOME[((profile as any)?.role as UserRole) ?? 'patient']);
  }

  const adminSupabase = createAdminClient();
  const { data: doctors } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  const activeDoctors = (doctors ?? []) as Profile[];

  return (
    <MarketingLayout>
      <HomeClient doctors={activeDoctors} />
    </MarketingLayout>
  );
}
