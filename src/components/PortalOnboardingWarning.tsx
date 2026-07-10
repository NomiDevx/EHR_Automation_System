'use client';

import Link from 'next/link';
import { Calendar, ShieldAlert } from 'lucide-react';

interface PortalOnboardingWarningProps {
  title: string;
  description: string;
}

export function PortalOnboardingWarning({ title, description }: PortalOnboardingWarningProps) {
  return (
    <div className="max-w-md mx-auto my-12 animate-fade-in">
      <div className="card bg-gradient-to-br from-blue-600/10 via-blue-900/5 to-transparent border-blue-500/20 p-8 flex flex-col items-center text-center gap-4 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/25 rounded-full blur-xl animate-pulse" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/15 border border-blue-400/30 text-blue-400">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mt-2">
          {title}
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed max-w-sm">
          {description}
        </p>

        <Link
          href="/portal"
          className="mt-4 px-6 py-2.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(220,55%,28%)] transition-all shadow-md flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" /> Book Onboarding Consultation
        </Link>
      </div>
    </div>
  );
}
