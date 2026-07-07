'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartPulse, Menu, X, LogIn, UserPlus, Phone, Mail, MapPin } from 'lucide-react';
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
    { href: '/#doctors-section', label: 'Doctors' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
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
      <header className="relative border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shadow-glow">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))]">
                MediCore EHR
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-[hsl(var(--primary))]",
                    isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <span className="btn btn-ghost inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium cursor-pointer">
                <LogIn className="w-4 h-4" /> Sign In
              </span>
            </Link>
            <Link href="/signup">
              <span className="btn btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium cursor-pointer">
                <UserPlus className="w-4 h-4" /> Patient Portal
              </span>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] animate-fade-in absolute top-16 left-0 right-0 shadow-lg">
            <div className="px-4 pt-2 pb-6 space-y-3 flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-base font-medium transition-colors hover:bg-[hsl(var(--surface-hover))]",
                    pathname === link.href ? "text-[hsl(var(--primary))] bg-[hsl(var(--surface-hover))]" : "text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-[hsl(var(--border-muted))] flex flex-col gap-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <span className="btn btn-ghost w-full justify-center inline-flex items-center gap-1.5 text-sm font-medium py-2.5">
                    <LogIn className="w-4 h-4" /> Sign In
                  </span>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <span className="btn btn-primary w-full justify-center inline-flex items-center gap-1.5 text-sm font-medium py-2.5">
                    <UserPlus className="w-4 h-4" /> Patient Portal
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] py-12 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <span className="text-base font-bold text-[hsl(var(--foreground))]">MediCore Healthcare</span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm">
                MediCore EHR is an advanced digital healthcare platform designed to streamline electronic health record operations and clinical workflows. Accessible, secure, and intuitive clinical operations.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
                <li><Link href="/" className="hover:text-[hsl(var(--primary))] transition-colors">Home</Link></li>
                <li><Link href="/#doctors-section" className="hover:text-[hsl(var(--primary))] transition-colors">Find a Doctor</Link></li>
                <li><Link href="/about" className="hover:text-[hsl(var(--primary))] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[hsl(var(--primary))] transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">Contact Info</h3>
              <ul className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>100 Medical Plaza, Suite 400, NY</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>support@medicore-ehr.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--border-muted))] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <p>© {new Date().getFullYear()} MediCore Healthcare. All rights reserved.</p>
            <p className="opacity-60 text-center sm:text-right">⚠️ Demo/Portfolio project — not a certified HIPAA system. Do not enter sensitive health data.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
