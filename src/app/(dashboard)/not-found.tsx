'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { 
  FileText, Search, AlertTriangle, ArrowLeft, 
  LayoutDashboard, Calendar, Users, ShieldAlert,
  ClipboardList, Pill, Mail, MessageSquare, Receipt 
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  doctor: '/clinical/patients',
  nurse: '/clinical/patients',
  receptionist: '/reception',
  patient: '/portal',
};

export default function DashboardNotFound() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile) {
            setRole(profile.role);
          }
        }
      } catch (err) {
        console.error('Error fetching role in nested 404:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserRole();
  }, [supabase]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    if (role === 'doctor' || role === 'nurse') {
      router.push(`/clinical/patients?search=${encodeURIComponent(query)}`);
    } else if (role === 'receptionist') {
      router.push(`/reception?search=${encodeURIComponent(query)}`);
    } else if (role === 'admin') {
      router.push(`/admin/users?search=${encodeURIComponent(query)}`);
    } else {
      router.push(`/portal?search=${encodeURIComponent(query)}`);
    }
  };

  const isStaff = role && ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {styleTag()}
      <div className="w-full max-w-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))]/70 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        
        {/* Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">Resource Not Located</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Clinical Workspace Notice (404)</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 space-y-8">
          
          <div className="space-y-3">
            <h1 className="text-2xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
              Page or Chart Record Not Found
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              The database record, medical chart page, or clinical dashboard view you requested could not be located. This usually happens if a patient ID is invalid, a session record has expired, or a tab subroute has been moved.
            </p>
          </div>

          {/* Quick Search for Staff */}
          {!loading && isStaff && (
            <div className="border border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/50 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Clinical Patient Lookup
              </h3>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter MRN, Patient First/Last Name..."
                    className="input w-full pl-10 h-10 text-xs"
                    id="dashboard-404-search-input"
                  />
                </div>
                <button
                  type="submit"
                  id="dashboard-404-search-submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 text-xs font-semibold transition-all shadow-sm shrink-0"
                >
                  Lookup
                </button>
              </form>
            </div>
          )}

          {/* Role-Specific Shortcut Grid */}
          {!loading && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Quick Workspace Shortcuts
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {role === 'admin' && (
                  <>
                    <ShortcutCard href="/admin" icon={LayoutDashboard} title="Admin Center" desc="System statistics and setup" />
                    <ShortcutCard href="/admin/users" icon={Users} title="User Accounts" desc="Manage doctors, nurses & staff" />
                    <ShortcutCard href="/admin/audit-logs" icon={ShieldAlert} title="Audit Logging" desc="Track security events & database changes" />
                  </>
                )}

                {(role === 'doctor' || role === 'nurse') && (
                  <>
                    <ShortcutCard href="/clinical/patients" icon={Users} title="Patients Chartroom" desc="Open charts, vitals & clinical history" />
                    <ShortcutCard href="/schedule" icon={Calendar} title="Clinical Schedule" desc="Check appointments and calendars" />
                  </>
                )}

                {role === 'receptionist' && (
                  <>
                    <ShortcutCard href="/reception" icon={LayoutDashboard} title="Reception Center" desc="Check-ins, appointments & scheduling" />
                    <ShortcutCard href="/reception/patients" icon={Users} title="Patient Registration" desc="Register or update client records" />
                    <ShortcutCard href="/reception/billing" icon={Receipt} title="Billing & Invoicing" desc="Manage checkout, billing and claims" />
                    <ShortcutCard href="/schedule" icon={Calendar} title="Interactive Schedule" desc="Book or move appointments" />
                  </>
                )}

                {role === 'patient' && (
                  <>
                    <ShortcutCard href="/portal" icon={LayoutDashboard} title="My Health Portal" desc="Portal home dashboard" />
                    <ShortcutCard href="/portal/appointments" icon={Calendar} title="My Appointments" desc="Schedule or cancel consultations" />
                    <ShortcutCard href="/portal/medications" icon={Pill} title="Medications List" desc="Active prescriptions & pharmacies" />
                    <ShortcutCard href="/portal/labs" icon={ClipboardList} title="Lab Results" desc="View clinical records and reports" />
                    <ShortcutCard href="/portal/messages" icon={MessageSquare} title="Message Clinic" desc="Send messages to your providers" />
                  </>
                )}
                
                {/* Fallback general card if role is missing/resolving */}
                {!role && (
                  <ShortcutCard href="/" icon={LayoutDashboard} title="Main Portal" desc="Return to system portal login" />
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-[hsl(var(--background))]/60 border-t border-[hsl(var(--border))]/70 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            id="dashboard-404-back-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-xs font-semibold hover:bg-[hsl(var(--surface-hover))] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Previous Page
          </button>
          
          {!loading && role && (
            <Link href={ROLE_HOME[role] || '/portal'} className="w-full sm:w-auto">
              <span className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 text-xs font-semibold transition-all cursor-pointer shadow-sm">
                Dashboard Home
              </span>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}

function ShortcutCard({ href, icon: Icon, title, desc }: { href: string; icon: any; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 p-3 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--muted-foreground))]/30 transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center justify-center shrink-0 group-hover:bg-[hsl(var(--primary))]/10 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <h4 className="text-xs font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
          {title}
        </h4>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
          {desc}
        </p>
      </div>
    </Link>
  );
}

function styleTag() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out forwards;
      }
    `}} />
  );
}
