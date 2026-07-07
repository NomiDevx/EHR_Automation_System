import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Calendar, Users, Receipt, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Reception Dashboard' };

export default async function ReceptionPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [
    { data: todayAppts },
    { count: totalPatients },
    { data: pendingInvoices },
  ] = await Promise.all([
    supabase.from('appointments').select('*, patient:patients(first_name, last_name, mrn), provider:profiles(first_name, last_name)')
      .gte('scheduled_at', today).lt('scheduled_at', tomorrow)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .order('scheduled_at'),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('invoices').select('*, patient:patients(first_name, last_name)').in('status', ['draft', 'submitted']).limit(5).order('issued_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Reception Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 border-blue-500/20 bg-blue-500/5">
          <div className="rounded-xl p-2.5 bg-blue-500/20"><Calendar className="w-5 h-5 text-blue-400" /></div>
          <div><p className="text-2xl font-bold">{todayAppts?.length ?? 0}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Today's Appointments</p></div>
        </div>
        <div className="card flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="rounded-xl p-2.5 bg-emerald-500/20"><Users className="w-5 h-5 text-emerald-400" /></div>
          <div><p className="text-2xl font-bold">{totalPatients ?? 0}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Active Patients</p></div>
        </div>
        <div className="card flex items-center gap-4 border-amber-500/20 bg-amber-500/5">
          <div className="rounded-xl p-2.5 bg-amber-500/20"><Receipt className="w-5 h-5 text-amber-400" /></div>
          <div><p className="text-2xl font-bold">{pendingInvoices?.length ?? 0}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Pending Invoices</p></div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/reception/patients/new" id="reception-register-btn" className="card-hover flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/20"><Users className="w-5 h-5 text-blue-400" /></div>
          <div><p className="text-sm font-medium">Register Patient</p><p className="text-xs text-[hsl(var(--muted-foreground))]">New patient intake</p></div>
        </Link>
        <Link href="/schedule/new" id="reception-book-btn" className="card-hover flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-emerald-500/10 border border-emerald-500/20"><Calendar className="w-5 h-5 text-emerald-400" /></div>
          <div><p className="text-sm font-medium">Book Appointment</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Schedule a visit</p></div>
        </Link>
      </div>

      {/* Today's appointments */}
      <Card>
        <div className="section-header">
          <h2 className="section-title">Today's Schedule</h2>
          <Link href="/schedule" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
        </div>
        <div className="space-y-2">
          {todayAppts?.map((a: any) => (
            <div key={a.id} className="flex items-center gap-4 py-2 border-b border-[hsl(var(--border-muted))] last:border-0">
              <div className="text-center min-w-[56px]">
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">{formatDate(a.scheduled_at, 'h:mm')}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(a.scheduled_at, 'a')}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{(a.patient as any)?.first_name} {(a.patient as any)?.last_name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Dr. {(a.provider as any)?.last_name} · {a.duration_mins} min</p>
              </div>
              <span className={`badge text-xs ${a.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {a.status}
              </span>
            </div>
          ))}
          {!todayAppts?.length && <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">No appointments today</p>}
        </div>
      </Card>
    </div>
  );
}
