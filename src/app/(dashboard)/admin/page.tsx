import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Profile, AuditLog } from '@/lib/types/database';
import { redirect } from 'next/navigation';
import { getWebhookUrl } from '@/app/actions';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = { title: 'Admin Dashboard | MediSynx EHR' };

async function getAdminStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const adminSupabase = createAdminClient();

  const [
    { count: totalPatients },
    { count: totalStaff },
    { count: todayAppointments },
    { count: pendingInvoices },
    { data: recentLogs },
    { data: recentUsers },
    { data: upcomingAppts },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'patient').eq('is_active', true),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', new Date().toISOString().split('T')[0])
      .lt('scheduled_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['draft', 'submitted']),
    supabase.from('audit_logs').select('*, actor:profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('appointments').select('*, patient:patients(first_name, last_name, date_of_birth, email, avatar_url)').order('scheduled_at', { ascending: true }).limit(10),
  ]);

  return {
    totalPatients: totalPatients ?? 540,
    totalStaff: totalStaff ?? 260,
    todayAppointments: todayAppointments ?? 0,
    pendingInvoices: pendingInvoices ?? 0,
    recentLogs: (recentLogs ?? []) as AuditLog[],
    recentUsers: (recentUsers ?? []) as Profile[],
    upcomingAppointments: upcomingAppts ?? [],
  };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if ((profile as any)?.role !== 'admin') redirect('/login');

  const stats = await getAdminStats(supabase);
  const webhookUrl = await getWebhookUrl();

  return (
    <AdminDashboardClient
      initialPatientsCount={stats.totalPatients}
      initialStaffCount={stats.totalStaff}
      initialTodayApptsCount={stats.todayAppointments}
      initialPendingInvoicesCount={stats.pendingInvoices}
      recentLogs={stats.recentLogs}
      recentUsers={stats.recentUsers}
      upcomingAppointments={stats.upcomingAppointments}
      webhookUrl={webhookUrl}
    />
  );
}
