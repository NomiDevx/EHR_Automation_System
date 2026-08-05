'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn, ROLE_LABELS } from '@/lib/utils';
import type { Profile, UserRole } from '@/lib/types/database';
import {
  LayoutDashboard, Users, Calendar, FileText, Activity,
  Pill, FlaskConical, Receipt, MessageSquare, Shield,
  ChevronLeft, ChevronRight, LogOut, Bell, Search,
  Home, FolderOpen, ClipboardList, AlertTriangle,
  Menu, X, Bot, UserCircle, Sparkles, ExternalLink
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';

// ─── Nav item definitions per role ──────────────────────────────────────────
const NAV_ITEMS: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/assistant', label: 'Booking Assistant', icon: Bot },
  ],
  doctor: [
    { href: '/clinical/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clinical/patients', label: 'Patients', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/clinical/notes', label: 'Clinical Notes', icon: FileText },
    { href: '/clinical/messages', label: 'Messages', icon: MessageSquare },
  ],
  nurse: [
    { href: '/clinical/nurse', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clinical/patients', label: 'Patients', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/clinical/vitals', label: 'Vitals', icon: Activity },
    { href: '/clinical/messages', label: 'Messages', icon: MessageSquare },
  ],
  receptionist: [
    { href: '/reception', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reception/patients/new', label: 'Register Patient', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/assistant', label: 'Booking Assistant', icon: Bot },
    { href: '/reception/billing', label: 'Billing', icon: Receipt },
  ],
  patient: [
    { href: '/portal', label: 'Dashboard', icon: Home },
    { href: '/assistant', label: 'Booking Assistant', icon: Bot },
    { href: '/portal/appointments', label: 'Appointments', icon: Calendar },
    { href: '/portal/records', label: 'My Records', icon: FolderOpen },
    { href: '/portal/labs', label: 'Lab Results', icon: FlaskConical },
    { href: '/portal/medications', label: 'Medications', icon: Pill },
    { href: '/portal/messages', label: 'Messages', icon: MessageSquare },
    { href: '/portal/documents', label: 'Documents', icon: ClipboardList },
    { href: '/portal/profile', label: 'My Profile', icon: UserCircle },
  ],
};

const SESSION_TIMEOUT_MS: Record<UserRole, number> = {
  admin: 30 * 60 * 1000,
  doctor: 30 * 60 * 1000,
  nurse: 30 * 60 * 1000,
  receptionist: 30 * 60 * 1000,
  patient: 60 * 60 * 1000,
};
const WARNING_MS = 2 * 60 * 1000;

interface AppShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

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

  const resetTimer = useCallback(() => {
    setShowTimeoutWarning(false);
  }, []);

  // Fetch unread messages count & subscribe to realtime changes
  useEffect(() => {
    if (!profile?.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .is('read_at', null);

      setUnreadMessages(count ?? 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('unread-messages-count-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id, supabase]);

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

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/';
  };

  const roleBadgeStyle: Record<UserRole, string> = {
    admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    doctor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    nurse: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    receptionist: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    patient: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  const activeNavLabel = navItems.find((item) => isLinkActive(item.href))?.label ?? 
    navItems.find((item) => pathname.startsWith(item.href))?.label ?? 
    'MediSynx EHR';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Professional Navy (#0B2A55) Sidebar ── */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-40 flex flex-col justify-between',
          'bg-[#0B2A55] text-white border-r border-[#12386D]',
          'transition-all duration-300 ease-in-out shadow-xl',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header Logo Section */}
        <div className="p-4 border-b border-[#12386D] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            {!collapsed ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 shadow-sm flex items-center justify-center h-12 w-44 overflow-hidden">
                <Image
                  src="/images/image.png"
                  alt="MediSynx EHR Logo"
                  width={160}
                  height={50}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-1.5 shadow-sm flex items-center justify-center h-11 w-11 mx-auto overflow-hidden">
                <Image
                  src="/images/image.png"
                  alt="MediSynx EHR Logo"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 scrollbar-thin">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isLinkActive(href);
            const isMessages = href.includes('/messages');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group relative',
                  active
                    ? 'bg-[#0891B2] text-white shadow-md shadow-[#0891B2]/25 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#12386D]',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', active ? 'text-white' : 'text-[#22D3EE]')} />
                {!collapsed && <span className="truncate">{label}</span>}

                {/* Render unread messages badge counter */}
                {isMessages && unreadMessages > 0 && (
                  <span
                    className={cn(
                      'ml-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm transition-all',
                      active ? 'bg-white text-[#0891B2]' : 'bg-[#0891B2] text-white',
                      collapsed && 'absolute -top-1 -right-1 px-1.5 py-0.2'
                    )}
                  >
                    {unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card & Sign Out Button */}
        <div className="p-3.5 border-t border-[#12386D] bg-[#071D3C]">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar firstName={profile.first_name} lastName={profile.last_name} size="sm" role={profile.role} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <span className={cn('inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5', roleBadgeStyle[profile.role])}>
                    {ROLE_LABELS[profile.role]}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#DC2626] transition-all"
                title="Sign out"
                id="signout-btn"
                type="button"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#DC2626] transition-all w-full flex justify-center"
              title="Sign out"
              type="button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-20 w-6 h-6 rounded-full',
            'bg-white border border-[#E2E8F0] shadow-md',
            'flex items-center justify-center text-[#0B2A55]',
            'hover:bg-[#0891B2] hover:text-white transition-all',
            'hidden lg:flex'
          )}
          id="sidebar-collapse-btn"
          type="button"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* ── Main Workspace Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* ── HIGHLY PROFESSIONAL PORTAL TOP HEADER ────────────────── */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[#E2E8F0] bg-white shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            {/* Mobile drawer button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
              id="mobile-menu-btn"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Eyebrow & Page Title */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0891B2] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] animate-pulse" />
                MediSynx EHR · {ROLE_LABELS[profile.role]} Portal
              </span>
              <h1 className="font-cambria text-lg sm:text-xl font-bold text-[#0B2A55] leading-none mt-0.5">
                {activeNavLabel}
              </h1>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Public Website Switcher */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:text-[#0891B2] hover:bg-[#F8FAFC] transition-colors"
              title="Visit Main Website"
            >
              <span>Main Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#0891B2]" />
            </Link>

            {/* Notifications Button with unread indicator */}
            <button
              className="p-2 rounded-xl text-[#475569] hover:bg-[#F8FAFC] border border-[#E2E8F0] relative transition-colors"
              id="notifications-btn"
              title="Notifications"
              type="button"
            >
              <Bell className="w-4 h-4 text-[#0B2A55]" />
              {unreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#0891B2] ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Info Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
              <Avatar
                firstName={profile.first_name}
                lastName={profile.last_name}
                size="sm"
                role={profile.role}
                className="cursor-pointer border border-[#0891B2]/30 shadow-sm"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#0B2A55] leading-none">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-[10px] font-semibold text-[#0891B2] mt-0.5">
                  {profile.role.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* ── LOGOUT CONFIRMATION MODAL DIALOG ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#DC2626] border border-red-100 flex items-center justify-center mx-auto shrink-0 shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-cambria text-2xl font-bold text-[#0B2A55]">
                Confirm Sign Out
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Are you sure you want to end your current session? You will need to sign in again to access your dashboard and records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isSigningOut}
                className="flex-1 px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSignOut}
                disabled={isSigningOut}
                className="flex-1 px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSigningOut ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing out…
                  </>
                ) : (
                  'Yes, Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session Timeout Warning Toast ── */}
      {showTimeoutWarning && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="bg-[#0B2A55] text-white border border-[#0891B2] p-4 rounded-2xl shadow-xl flex items-start gap-3 max-w-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Session Expiring Soon</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                You will be automatically signed out in {timeoutCountdown}s due to inactivity.
              </p>
              <button
                onClick={resetTimer}
                className="mt-2.5 px-3.5 py-1.5 rounded-lg bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] transition-all shadow-sm"
                id="keep-session-btn"
                type="button"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
