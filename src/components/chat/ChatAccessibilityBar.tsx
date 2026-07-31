'use client';

import { Type, Contrast, Volume2, VolumeX, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAccessibilityBarProps {
  largeFont: boolean;
  highContrast: boolean;
  autoReadAloud: boolean;
  isSpeaking?: boolean;
  onLargeFontChange: (value: boolean) => void;
  onHighContrastChange: (value: boolean) => void;
  onAutoReadAloudChange: (value: boolean) => void;
  onStopSpeaking?: () => void;
  onOpenHistory?: () => void;
}

function ToggleButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-medium shrink-0 flex-1 sm:flex-none',
        'border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
        active
          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] shadow-sm'
          : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-hover))]',
      )}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ChatAccessibilityBar({
  largeFont,
  highContrast,
  autoReadAloud,
  isSpeaking,
  onLargeFontChange,
  onHighContrastChange,
  onAutoReadAloudChange,
  onStopSpeaking,
  onOpenHistory,
}: ChatAccessibilityBarProps) {
  return (
    <div
      className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 p-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
      role="toolbar"
      aria-label="Accessibility options"
    >
      <ToggleButton
        active={largeFont}
        onClick={() => onLargeFontChange(!largeFont)}
        label="Large text"
        icon={Type}
      />
      <ToggleButton
        active={highContrast}
        onClick={() => onHighContrastChange(!highContrast)}
        label="Contrast"
        icon={Contrast}
      />
      <ToggleButton
        active={autoReadAloud}
        onClick={() => onAutoReadAloudChange(!autoReadAloud)}
        label="Read aloud"
        icon={autoReadAloud ? Volume2 : VolumeX}
      />

      {onOpenHistory && (
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="View Chat History"
          title="View Chat History"
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-medium border bg-[hsl(var(--surface))] text-blue-400 border-blue-500/30 hover:bg-blue-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 flex-1 sm:flex-none"
        >
          <History className="w-4 h-4 shrink-0" />
          <span className="truncate">History</span>
        </button>
      )}

      {/* Prominent Stop Talking button whenever speech is playing */}
      {isSpeaking && onStopSpeaking && (
        <button
          type="button"
          onClick={onStopSpeaking}
          aria-label="Stop agent from talking"
          title="Stop agent from talking"
          className="ml-auto inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 animate-pulse shadow-md transition-all"
        >
          <VolumeX className="w-5 h-5 shrink-0" />
          <span>Stop talking</span>
        </button>
      )}
    </div>
  );
}
