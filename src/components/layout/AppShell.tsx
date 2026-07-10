'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn, ROLE_LABELS, getInitials } from '@/lib/utils';
import type { Profile, UserRole } from '@/lib/types/database';
import {
  LayoutDashboard, Users, Calendar, FileText, Activity,
  Pill, FlaskConical, Receipt, MessageSquare, Shield,
  ChevronLeft, ChevronRight, LogOut, Settings, Bell,
  HeartPulse, Home, FolderOpen, ClipboardList, AlertTriangle,
  Menu, X
} from 'lucide-react';
import { Avatar, Spinner } from '@/components/ui';

// ─── Nav item definitions per role ──────────────────────────────────────────
const NAV_ITEMS: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
  ],
  doctor: [
    { href: '/clinical/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clinical/patients', label: 'Patients', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/clinical/notes', label: 'Clinical Notes', icon: FileText },
  ],
  nurse: [
    { href: '/clinical/nurse', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clinical/patients', label: 'Patients', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/clinical/vitals', label: 'Vitals', icon: Activity },
  ],
  receptionist: [
    { href: '/reception', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reception/patients/new', label: 'Register Patient', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/reception/billing', label: 'Billing', icon: Receipt },
  ],
  patient: [
    { href: '/portal', label: 'Dashboard', icon: Home },
    { href: '/portal/appointments', label: 'Appointments', icon: Calendar },
    { href: '/portal/records', label: 'My Records', icon: FolderOpen },
    { href: '/portal/labs', label: 'Lab Results', icon: FlaskConical },
    { href: '/portal/medications', label: 'Medications', icon: Pill },
    { href: '/portal/messages', label: 'Messages', icon: MessageSquare },
    { href: '/portal/documents', label: 'Documents', icon: ClipboardList },
  ],
};

// Session timeout: 30 min for staff, 60 min for patients
const SESSION_TIMEOUT_MS: Record<UserRole, number> = {
  admin: 30 * 60 * 1000,
  doctor: 30 * 60 * 1000,
  nurse: 30 * 60 * 1000,
  receptionist: 30 * 60 * 1000,
  patient: 60 * 60 * 1000,
};
const WARNING_MS = 2 * 60 * 1000; // warn 2 min before timeout

interface AppShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = NAV_ITEMS[profile.role] ?? [];

  const isLinkActive = (href: string) => {
    if (
      href === '/portal' ||
      href === '/admin' ||
      href === '/reception' ||
      href === '/clinical/dashboard' ||
      href === '/clinical/nurse'
    ) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // ─── Session timeout logic ───────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    setShowTimeoutWarning(false);
  }, []);

  useEffect(() => {
    const timeoutMs = SESSION_TIMEOUT_MS[profile.role];
    let warningTimer: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const startTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      setShowTimeoutWarning(false);

      warningTimer = setTimeout(() => {
        setShowTimeoutWarning(true);
        let secs = Math.floor(WARNING_MS / 1000);
        setTimeoutCountdown(secs);
        countdownInterval = setInterval(() => {
          secs -= 1;
          setTimeoutCountdown(secs);
          if (secs <= 0) clearInterval(countdownInterval);
        }, 1000);
      }, timeoutMs - WARNING_MS);

      logoutTimer = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login?reason=timeout');
      }, timeoutMs);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => { startTimers(); resetTimer(); };

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    startTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
    };
  }, [profile.role, router, supabase, resetTimer]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const roleColor: Record<UserRole, string> = {
    admin: 'text-purple-400',
    doctor: 'text-blue-400',
    nurse: 'text-teal-400',
    receptionist: 'text-amber-400',
    patient: 'text-slate-400',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-40 flex flex-col',
          'bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))]',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--border))]',
          collapsed && 'justify-center px-2'
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-[hsl(var(--foreground))]">MediCore</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">EHR System</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = isLinkActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  isActive ? 'nav-item-active' : 'nav-item',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={cn(
          'border-t border-[hsl(var(--border))] p-3',
          collapsed && 'flex flex-col items-center gap-2'
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-1 py-1">
              <Avatar firstName={profile.first_name} lastName={profile.last_name} size="sm" role={profile.role} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className={cn('text-xs truncate', roleColor[profile.role])}>
                  {ROLE_LABELS[profile.role]}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-ghost p-1.5 rounded-md"
                title="Sign out"
                id="signout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={handleSignOut} className="btn-ghost p-1.5 rounded-md w-full flex justify-center" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-20 w-6 h-6 rounded-full',
            'bg-[hsl(var(--surface))] border border-[hsl(var(--border))]',
            'flex items-center justify-center text-[hsl(var(--muted-foreground))]',
            'hover:text-[hsl(var(--foreground))] transition-colors',
            'hidden lg:flex'
          )}
          id="sidebar-collapse-btn"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden btn-ghost p-1.5"
              id="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-[hsl(var(--foreground))] hidden sm:block">
              {navItems.find((item) => isLinkActive(item.href))?.label ?? 
               navItems.find((item) => pathname.startsWith(item.href))?.label ?? 
               'MediCore EHR'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-1.5 relative" id="notifications-btn" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <Avatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="sm"
              role={profile.role}
              className="cursor-pointer"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* ── Session timeout warning ── */}
      {showTimeoutWarning && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="card border-amber-500/30 bg-amber-500/10 flex items-start gap-3 max-w-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-300">Session expiring soon</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                You will be signed out in {timeoutCountdown}s due to inactivity.
              </p>
              <button
                onClick={resetTimer}
                className="mt-2 btn-primary text-xs px-3 py-1"
                id="keep-session-btn"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
