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
        'inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border min-h-[36px]',
        active
          ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
          : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0B2A55]',
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span className="hidden xs:inline truncate">{label}</span>
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
      className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-[#E2E8F0] bg-white rounded-t-2xl sm:rounded-t-3xl"
      role="toolbar"
      aria-label="Accessibility options"
    >
      <div className="flex flex-wrap items-center gap-1.5">
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
      </div>

      <div className="flex items-center gap-1.5">
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="View Chat History"
            title="View Chat History"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-[#0891B2]/30 bg-[#0891B2]/10 text-[#0891B2] hover:bg-[#0891B2] hover:text-white transition-all shadow-sm"
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Chat History</span>
          </button>
        )}

        {isSpeaking && onStopSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all animate-pulse"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Stop Speaking</span>
          </button>
        )}
      </div>
    </div>
  );
}
