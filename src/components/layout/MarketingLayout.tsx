'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cross, Menu, X, LogIn, UserPlus, Phone, Mail, MapPin } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { cn } from '@/lib/utils';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/assistant', label: 'Book with Assistant' },
    { href: '/#doctors-section', label: 'Our Doctors' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
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
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-200">

      {/* Navigation Header */}
      <header className="relative border-b border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] flex items-center justify-between gap-6">

          {/* Logo — classy serif wordmark */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--primary))]">
              <Cross className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display text-xl font-600 tracking-wide text-[hsl(var(--foreground))]">
              Medi<span className="text-[hsl(var(--accent))]">Core</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    'relative text-sm font-medium tracking-wide transition-colors duration-200 pb-0.5',
                    'after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[hsl(var(--accent))] after:transition-transform after:duration-200 hover:after:scale-x-100',
                    isActive
                      ? 'text-[hsl(var(--foreground))] after:scale-x-100'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link href="/login">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer px-3 py-2">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </span>
            </Link>
            <Link href="/signup">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold cursor-pointer px-5 py-2 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 transition-all duration-200 shadow-sm">
                <UserPlus className="w-3.5 h-3.5" /> Patient Portal
              </span>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] animate-fade-in absolute top-[70px] left-0 right-0 shadow-xl">
            <div className="px-5 pt-4 pb-6 space-y-1 flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-[hsl(var(--foreground))] bg-[hsl(var(--surface-hover))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-hover))]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-[hsl(var(--border-muted))] flex flex-col gap-2 mt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <span className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-hover))] transition-colors cursor-pointer">
                    <LogIn className="w-4 h-4" /> Sign In
                  </span>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <span className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 transition-colors cursor-pointer">
                    <UserPlus className="w-4 h-4" /> Patient Portal
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer — dark navy with warm gold accents */}
      <footer className="bg-[hsl(220,45%,12%)] dark:bg-[hsl(222,42%,6%)] text-[hsl(38,20%,85%)] py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-10">

            {/* Brand */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--accent))]/20 border border-[hsl(var(--accent))]/30">
                  <Cross className="w-4 h-4 text-[hsl(var(--accent))] fill-[hsl(var(--accent))]" />
                </div>
                <span className="font-display text-lg font-semibold text-white tracking-wide">
                  Medi<span className="text-[hsl(var(--accent))]">Core</span> Healthcare
                </span>
              </div>
              <p className="text-sm text-[hsl(38,15%,62%)] leading-relaxed max-w-sm">
                An advanced digital healthcare platform designed to streamline electronic health records, outpatient operations, and clinical workflows with precision and care.
              </p>
              {/* Gold divider */}
              <div className="w-12 h-px bg-[hsl(var(--accent))]/40" />
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Quick Links</h3>
              <ul className="space-y-2.5">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/#doctors-section', label: 'Find a Doctor' },
                  { href: '/about', label: 'About Us' },
                  { href: '/contact', label: 'Contact Us' },
                  { href: '/signup', label: 'Patient Portal' },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[hsl(38,15%,60%)] hover:text-[hsl(var(--accent))] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">Contact</h3>
              <ul className="space-y-3 text-sm text-[hsl(38,15%,60%)]">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[hsl(var(--accent))]/70 shrink-0 mt-0.5" />
                  <span>100 Medical Plaza, Suite 400<br />New York, NY 10001</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[hsl(var(--accent))]/70 shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[hsl(var(--accent))]/70 shrink-0" />
                  <span>support@medicore-ehr.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[hsl(38,10%,48%)]">
            <p>© {new Date().getFullYear()} MediCore Healthcare. All rights reserved.</p>
            <p className="opacity-70 text-center sm:text-right">⚠️ Demo / Portfolio — not a certified HIPAA system.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
