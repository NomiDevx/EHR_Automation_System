'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, LogIn, UserPlus, Phone, Mail, MapPin, Sparkles, Calendar, UserCheck, Stethoscope, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#booking-section', label: 'Book Appointment' },
    { href: '/#doctors-section', label: 'Our Doctors' },
    { href: '/signup', label: 'Patient Portal' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/#')) {
      const elementId = href.replace('/#', '');
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">

      {/* ── TOP EMERGENCY & PORTAL QUICK ACCESS BANNER ───────────────────── */}
      <div className="bg-[#0B2A55] text-white text-xs font-semibold py-2 px-4 border-b border-blue-900/50 relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-200 text-[11px] sm:text-xs">24/7 Virtual Care Available — Urgent Medical Emergency? Call 911 immediately.</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px]">
            <Link href="/portal" className="text-cyan-300 hover:text-white transition-colors flex items-center gap-1 font-bold">
              <UserCheck className="w-3.5 h-3.5" /> Patient Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/clinical/patients" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> Doctor Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/admin" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Admin Access
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Curved Navigation Header with Gaps on Both Sides */}
      <div className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto pt-3 pb-1">
        <header className="border border-[#E2E8F0] bg-white/95 backdrop-blur-md rounded-full shadow-lg shadow-[#0B2A55]/5 px-4 sm:px-6 py-2 transition-all duration-300 flex items-center justify-between gap-4">

          {/* PROMINENT LARGE FREE STANDING LOGO — /images/image.png */}
          <Link href="/" className="flex items-center shrink-0 py-0.5">
            <Image
              src="/images/image.png"
              alt="MediSynx EHR Logo"
              width={350}
              height={60}
              className="h-10 sm:h-9 w-auto max-w-[180px] sm:max-w-[220px] object-contain scale-[2.6] sm:scale-[3.0] origin-left transition-transform hover:scale-[3.1] ml-2 sm:ml-4"
              priority
            />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-5 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    'relative text-xs sm:text-sm font-semibold transition-all duration-200 px-3.5 py-1.5 rounded-full',
                    isActive
                      ? 'text-[#0891B2] bg-[#0891B2]/10'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link href="/login">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-[#0891B2] transition-colors cursor-pointer px-3.5 py-2 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                <LogIn className="w-3.5 h-3.5 text-[#0891B2]" /> Sign In
              </span>
            </Link>
            <Link href="/#booking-section">
              <span className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white hover:opacity-95 transition-all shadow-md">
                <Calendar className="w-3.5 h-3.5" /> Book Now
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-full border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Curved Drawer */}
          {mobileOpen && (
            <div className="md:hidden border-t border-[#E2E8F0] bg-white animate-fade-in mt-3 pt-3 pb-2 px-2 rounded-2xl shadow-xl absolute top-full left-0 right-0 z-50">
              <div className="space-y-1 flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => handleLinkClick(link.href)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      pathname === link.href
                        ? 'text-[#0891B2] bg-[#0891B2]/10'
                        : 'text-[#475569] hover:bg-[#F8FAFC]'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2 mt-1">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <span className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#475569] px-4 py-2.5 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                      <LogIn className="w-4 h-4 text-[#0891B2]" /> Sign In
                    </span>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <span className="w-full flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white hover:opacity-95 transition-colors cursor-pointer shadow-sm">
                      <UserPlus className="w-4 h-4" /> Patient Portal
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer — Navy #0B2A55 */}
      <footer className="bg-[#0B2A55] text-white py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

            {/* Brand Column */}
            <div className="md:col-span-5 space-y-4">
              {/* Free Standing Large Footer Logo — /images/image.png */}
              <Link href="/" className="inline-block overflow-visible py-2">
                <Image
                  src="/images/image.png"
                  alt="MediSynx EHR Logo"
                  width={350}
                  height={100}
                  className="h-16 sm:h-20 w-auto max-w-[240px] sm:max-w-[320px] object-contain brightness-0 invert scale-[1.8] sm:scale-[2.2] origin-left transition-transform hover:scale-[2.25] my-2"
                />
              </Link>
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm font-normal">
                Next-generation Electronic Health Records platform designed for high performance, smart clinical workflows, and seamless patient care.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                Smart Records. Better Care.
              </div>
            </div>

            {/* Navigation Column */}
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-xs font-bold tracking-widest uppercase text-[#22D3EE]">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/#booking-section', label: 'Book Appointment' },
                  { href: '/#doctors-section', label: 'Clinical Specialists' },
                  { href: '/about', label: 'About Us' },
                  { href: '/contact', label: 'Contact Support' },
                  { href: '/signup', label: 'Patient Portal Sign Up' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-xs font-bold tracking-widest uppercase text-[#22D3EE]">
                Clinical Center Contact
              </h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#22D3EE] shrink-0 mt-1" />
                  <span>100 MediSynx Plaza, Suite 400<br />New York, NY 10001</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span>+1 (800) 555-SYNX</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span>support@medisynxehr.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} MediSynx EHR. All rights reserved.</p>
            <p className="opacity-80 text-center sm:text-right font-medium text-[#22D3EE]">
              MediSynx EHR — Smart Records. Better Care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
