'use client';

import { useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ChatInputBarProps {
  input: string;
  interimTranscript?: string;
  isLoading: boolean;
  isListening: boolean;
  speechSupported: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onMicToggle: () => void;
}

import { TalkToHumanButton } from './TalkToHumanButton';

export function ChatInputBar({
  input,
  interimTranscript,
  isLoading,
  isListening,
  speechSupported,
  onInputChange,
  onSend,
  onMicToggle,
}: ChatInputBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      onSend();
    }
  };

  return (
    <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
      {/* Live Voice Indicator Banner when Listening */}
      {isListening && (
        <div
          className="px-4 py-2.5 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-900/40 border-b border-blue-500/30 flex items-center justify-between gap-3 animate-pulse"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Animated Sound Wave Bars */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-1 h-4 bg-blue-400 rounded-full animate-[bounce_0.8s_infinite_100ms]" />
              <span className="w-1 h-6 bg-blue-500 rounded-full animate-[bounce_0.8s_infinite_300ms]" />
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-[bounce_0.8s_infinite_200ms]" />
              <span className="w-1 h-5 bg-indigo-400 rounded-full animate-[bounce_0.8s_infinite_400ms]" />
            </div>

            <div className="text-sm truncate">
              <span className="font-semibold text-blue-300">Listening…</span>{' '}
              {interimTranscript ? (
                <span className="text-blue-100 italic">"{interimTranscript}"</span>
              ) : (
                <span className="text-blue-300/70">Speak clearly into your microphone</span>
              )}
            </div>
          </div>

          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
            Live Voice Mode
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-4 pb-2"
        aria-label="Send a message"
      >
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Your message
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening… speak now or type here' : 'Type your message here…'}
            disabled={isLoading}
            autoComplete="off"
            className={cn(
              'input w-full min-h-[44px] text-base transition-colors',
              isListening && 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20 placeholder-blue-300/60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
            )}
          />
        </div>

        <Button
          type="button"
          variant={isListening ? 'destructive' : 'secondary'}
          size="lg"
          onClick={onMicToggle}
          disabled={!speechSupported || isLoading}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop listening' : 'Speak your message'}
          title={
            !speechSupported
              ? 'Voice input is not supported in this browser'
              : isListening
                ? 'Listening… tap to stop'
                : 'Tap to speak your message'
          }
          className={cn(
            'min-w-[44px] min-h-[44px] px-3 relative transition-all duration-300',
            isListening && 'ring-4 ring-red-500/40 scale-105 bg-red-600 hover:bg-red-700 text-white animate-pulse',
          )}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          type="submit"
          size="lg"
          loading={isLoading}
          disabled={(!input.trim() && !interimTranscript) || isLoading}
          aria-label="Send message"
          className="min-w-[44px] min-h-[44px] px-4"
        >
          <Send className="w-5 h-5" />
          <span className="sr-only">Send</span>
        </Button>
      </form>

      {/* Sub-bar with Talk to a real person option */}
      <div className="px-4 pb-2 flex justify-end items-center">
        <TalkToHumanButton inline />
      </div>
    </div>
  );
}
