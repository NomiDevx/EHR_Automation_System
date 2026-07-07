import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Profile, AuditLog } from '@/lib/types/database';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatRelative, formatCents } from '@/lib/utils';
import {
  Users, Calendar, FileText, Activity, Receipt,
  Shield, TrendingUp, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { Card } from '@/components/ui';
import { getWebhookUrl } from '@/app/actions';
import { AdminSettings } from '@/components/AdminSettings';

export const metadata: Metadata = { title: 'Admin Dashboard' };

async function getAdminStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalPatients },
    { count: totalStaff },
    { count: todayAppointments },
    { count: pendingInvoices },
    { data: recentLogs },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'patient').eq('is_active', true),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', new Date().toISOString().split('T')[0])
      .lt('scheduled_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['draft', 'submitted']),
    supabase.from('audit_logs').select('*, actor:profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(8),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
  ]);
  return {
    totalPatients,
    totalStaff,
    todayAppointments,
    pendingInvoices,
    recentLogs: (recentLogs ?? []) as AuditLog[],
    recentUsers: (recentUsers ?? []) as Profile[],
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

  const statCards = [
    { label: 'Active Patients', value: stats.totalPatients ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Staff Members', value: stats.totalStaff ?? 0, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: "Today's Appointments", value: stats.todayAppointments ?? 0, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending Invoices', value: stats.pendingInvoices ?? 0, icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">System Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          {formatDate(new Date(), 'EEEE, MMMM d, yyyy')} — Full admin access
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card border ${bg} flex items-center gap-4`}>
            <div className={`rounded-xl p-2.5 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/users" id="admin-manage-users-link" className="card-hover group flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/20">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Manage Users</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Create, edit, deactivate accounts</p>
          </div>
        </Link>
        <Link href="/admin/audit-logs" id="admin-audit-logs-link" className="card-hover group flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-purple-500/10 border border-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Audit Logs</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Access and compliance review</p>
          </div>
        </Link>
        <Link href="/schedule" id="admin-schedule-link" className="card-hover group flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-emerald-500/10 border border-emerald-500/20">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Schedule</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">View all appointments</p>
          </div>
        </Link>
      </div>

      {/* Two columns: Audit log + Recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit log */}
        <Card>
          <div className="section-header">
            <h2 className="section-title">Recent Audit Events</h2>
            <Link href="/admin/audit-logs" className="text-xs text-blue-400 hover:text-blue-300" id="view-all-audit-link">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentLogs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-[hsl(var(--border-muted))] last:border-0">
                <div className="mt-0.5">
                  {['delete', 'export'].includes(log.action) ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[hsl(var(--foreground))]">
                    <span className="font-medium">
                      {log.actor?.first_name} {log.actor?.last_name}
                    </span>{' '}
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {log.action}d on {log.table_name}
                    </span>
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelative(log.created_at)}</p>
                </div>
              </div>
            ))}
            {!stats.recentLogs?.length && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] py-4 text-center">No audit events yet</p>
            )}
          </div>
        </Card>

        {/* Recent users */}
        <Card>
          <div className="section-header">
            <h2 className="section-title">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300" id="view-all-users-link">
              View all →
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers?.map((u) => (
                <tr key={u.id}>
                  <td className="text-[hsl(var(--foreground))]">{u.first_name} {u.last_name}</td>
                  <td>
                    <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30">{u.role}</span>
                  </td>
                  <td className="text-[hsl(var(--muted-foreground))]">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* System Configurations Section */}
      <div className="pt-2">
        <AdminSettings initialWebhookUrl={webhookUrl} />
      </div>
    </div>
  );
}
