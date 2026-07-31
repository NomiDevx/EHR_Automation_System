'use client';

import { useState } from 'react';
import { Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEHOLDER_PHONE = '(555) 123-4567';
const CLINIC_HOURS = 'Monday – Friday, 8:00 AM – 5:00 PM';

export function TalkToHumanButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Talk to a real person"
        className={cn(
          'fixed z-40 bottom-4 right-4 sm:bottom-8 sm:right-8',
          'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full',
          'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]',
          'text-xs sm:text-sm font-semibold shadow-xl',
          'hover:brightness-110 transition-all opacity-95 hover:opacity-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--accent))]',
        )}
      >
        <Phone className="w-4 h-4 shrink-0" aria-hidden />
        <span>Talk to a real person</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="talk-to-human-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-[hsl(var(--surface-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4 pr-8">
              <h2 id="talk-to-human-title" className="font-display text-xl font-semibold text-[hsl(var(--foreground))]">
                Need to speak with someone?
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                Our reception team is happy to help you book an appointment over the phone.
              </p>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Call us at</p>
                <p className="text-2xl font-semibold text-[hsl(var(--foreground))]">{PLACEHOLDER_PHONE}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{CLINIC_HOURS}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
