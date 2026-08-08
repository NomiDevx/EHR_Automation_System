import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Profile, AuditLog } from '@/lib/types/database';
import { redirect } from 'next/navigation';
import { getWebhookUrl, getLiveAdminDashboardData } from '@/app/actions';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = { title: 'Admin Dashboard | MediSynx EHR' };

async function getAdminStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const adminSupabase = createAdminClient();

  const [
    liveData,
    { data: recentLogs },
    { data: recentUsers },
  ] = await Promise.all([
    getLiveAdminDashboardData(),
    supabase.from('audit_logs').select('*, actor:profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  return {
    totalPatients: liveData?.patientsCount ?? 540,
    totalStaff: liveData?.doctorsCount ?? 260,
    totalVisitors: liveData?.totalVisitorsCount ?? 5568,
    todayAppointments: 0,
    pendingInvoices: 0,
    recentLogs: (recentLogs ?? []) as AuditLog[],
    recentUsers: (recentUsers ?? []) as Profile[],
    upcomingAppointments: liveData?.appointments ?? [],
    demographics: liveData?.demographics,
    weeklyChartData: liveData?.weeklyChartData,
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
      demographics={stats.demographics}
      weeklyChartData={stats.weeklyChartData}
    />
  );
}
