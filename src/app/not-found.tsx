'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui';
import { 
  Activity, Play, Pause, RotateCcw, ArrowRight, 
  ChevronRight, Home, LayoutDashboard, AlertCircle, Cross 
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  doctor: '/clinical/patients',
  nurse: '/clinical/patients',
  receptionist: '/reception',
  patient: '/portal',
};

export default function NotFoundPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [isReported, setIsReported] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch authentication status client-side
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile) {
            setUserRole(profile.role);
          }
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [supabase]);

  // Countdown timer redirect effect
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isAuthenticated, userRole]);

  const getRedirectPath = () => {
    if (isAuthenticated) {
      return userRole ? (ROLE_HOME[userRole] || '/portal') : '/portal';
    }
    return '/';
  };

  const handleRedirect = () => {
    const path = getRedirectPath();
    router.push(path);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const resetTimer = () => {
    setSecondsLeft(10);
    setIsPaused(false);
  };

  const handleReport = () => {
    setIsReported(true);
  };

  const percentage = (secondsLeft / 10) * 100;

  return (
    <MarketingLayout>
      {/* Inline ECG Grid & Line Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ecg-pulse {
          0% {
            stroke-dashoffset: 1200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .ecg-line {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: ecg-pulse 3s linear infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .float-card {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}} />

      {/* Decorative Blur Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-12">
        {/* ECG Telemetry Box */}
        <div className="w-full max-w-2xl bg-[hsl(220,45%,11%)] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Header info bar */}
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              STATUS: HEARTBEAT INTERRUPTED
            </span>
            <span>SYS.ERR_404_PAGE_NOT_FOUND</span>
          </div>

          {/* ECG Line Display Area */}
          <div className="relative h-44 bg-[hsl(222,40%,7%)] flex items-center justify-center overflow-hidden">
            {/* Grid Pattern Background */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="ecg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill="none" />
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="0.5" />
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(148, 163, 184, 0.09)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#ecg-grid)" />
            </svg>

            {/* Glowing heartbeat path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Underlay glow path */}
              <path
                d="M0,75 L180,75 L190,60 L200,90 L210,40 L220,115 L230,75 L420,75 L430,60 L440,90 L450,40 L460,115 L470,75 L620,75 L625,75 Q635,75 640,75 T650,75 L655,40 L660,125 L665,95 L672,75 L800,75"
                stroke="hsl(43, 62%, 55%)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="ecg-line opacity-80"
              />
              
              {/* Primary line path */}
              <path
                d="M0,75 L180,75 L190,60 L200,90 L210,40 L220,115 L230,75 L420,75 L430,60 L440,90 L450,40 L460,115 L470,75 L620,75 L625,75 Q635,75 640,75 T650,75 L655,40 L660,125 L665,95 L672,75 L800,75"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ecg-line"
              />
            </svg>
            
            {/* Massive 404 Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-8xl sm:text-9xl font-extrabold text-white/5 font-display tracking-widest">
                404
              </span>
            </div>
          </div>
        </div>

        {/* Text content details */}
        <div className="space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-[hsl(var(--accent))]">
            <AlertCircle className="w-3.5 h-3.5" /> Out of Bounds
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-[hsl(var(--foreground))]">
            Page Interrupted or Removed
          </h1>
          <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
            The page, medical resource, or chart path you are trying to access does not exist, has been deleted, or requires authorization credentials you currently lack.
          </p>
        </div>

        {/* Interactive countdown bar & panel */}
        <div className="w-full max-w-md mx-auto border border-[hsl(var(--border))]/60 bg-[hsl(var(--surface))]/40 backdrop-blur-md rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-[hsl(var(--muted-foreground))] font-mono">
            <span>REDIRECT TIMEOUT</span>
            <span>
              {secondsLeft > 0 ? `REDIRECTING IN ${secondsLeft}s` : 'REDIRECTING NOW...'}
            </span>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-[hsl(var(--accent))] transition-all duration-1000 ease-linear"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={togglePause}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-hover))]"
                id="pause-countdown-btn"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-green-400" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetTimer}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-hover))]"
                id="reset-countdown-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>

            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRedirect}
              className="text-xs flex items-center gap-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 px-3 py-1.5 rounded-lg"
              id="skip-countdown-btn"
            >
              Skip Redirect <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="text-[11px] text-[hsl(var(--muted-foreground))] opacity-75 font-mono pt-1 text-left">
            {!loading && (
              <span>
                Target Path:{' '}
                <span className="text-[hsl(var(--accent))] select-all">
                  {getRedirectPath()}
                </span>{' '}
                ({isAuthenticated ? 'Authenticated' : 'Guest'})
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto pt-2">
          {isAuthenticated ? (
            <Link href={userRole ? (ROLE_HOME[userRole] || '/portal') : '/portal'} className="w-full sm:w-auto">
              <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(var(--primary))]/90 transition-all cursor-pointer shadow-sm">
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </span>
            </Link>
          ) : (
            <Link href="/" className="w-full sm:w-auto">
              <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:bg-[hsl(var(--primary))]/90 transition-all cursor-pointer shadow-sm">
                <Home className="w-4 h-4" /> Return Home
              </span>
            </Link>
          )}

          {isReported ? (
            <div className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center justify-center gap-1.5">
              ✓ Issue reported to site administration.
            </div>
          ) : (
            <button
              onClick={handleReport}
              id="report-404-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-sm font-semibold hover:bg-[hsl(var(--surface-hover))] transition-all cursor-pointer"
            >
              Report Broken Link
            </button>
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
