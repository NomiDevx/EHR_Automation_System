'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, LogIn, UserPlus, Phone, Mail, MapPin, Sparkles, Calendar } from 'lucide-react';
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

      {/* Floating Curved Navigation Header with Gaps on Both Sides */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto">
        <header className="border border-[#E2E8F0] bg-white/95 backdrop-blur-md rounded-full shadow-lg shadow-[#0B2A55]/5 px-4 sm:px-6 py-2 transition-all duration-300 flex items-center justify-between gap-4">

          {/* PROMINENT LARGE LOGO CARD — Clean & Clearly Visible */}
          <Link href="/" className="flex items-center group shrink-0">
            <div className="relative h-12 sm:h-14 w-44 sm:w-56 bg-white border border-[#E2E8F0] rounded-2xl px-3 py-1.5 shadow-sm flex items-center justify-center overflow-hidden group-hover:border-[#0891B2] group-hover:shadow-md transition-all">
              <Image
                src="/images/image.png"
                alt="MediSynx EHR Logo"
                width={220}
                height={70}
                className="object-contain w-full h-full p-0.5"
                priority
              />
            </div>
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
              {/* Prominent Large Footer Logo Box */}
              <div className="inline-flex items-center bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-2xl shadow-sm w-48 sm:w-60 h-14 sm:h-16">
                <Image
                  src="/images/image.png"
                  alt="MediSynx EHR Logo"
                  width={240}
                  height={80}
                  className="object-contain w-full h-full p-0.5"
                />
              </div>
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
