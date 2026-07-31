'use client';

import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, isSpeechSynthesisSupported } from '@/lib/agent/speech';
import { FormattedMarkdown } from './FormattedMarkdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  options?: string[];
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onOptionSelect: (option: string) => void;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Assistant is typing">
      <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function ChatMessageList({ messages, isLoading, onOptionSelect }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const canSpeak = isSpeechSynthesisSupported();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.length === 0 && !isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[85%] sm:max-w-[75%] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl rounded-bl-sm px-4 py-3 text-[hsl(var(--foreground))]">
            <p>Type or tap the microphone to start booking your appointment.</p>
          </div>
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <div key={message.id} className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3',
                isUser
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-br-sm'
                  : 'bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-bl-sm',
              )}
            >
              <FormattedMarkdown content={message.text} />
            </div>

            {!isUser && (
              <div className="flex flex-col items-start gap-2 max-w-[85%] sm:max-w-[75%]">
                {canSpeak && (
                  <button
                    type="button"
                    onClick={() => speak(message.text)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-sm font-medium text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded-lg"
                    aria-label="Repeat that message aloud"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden />
                    Repeat that
                  </button>
                )}

                {message.options && message.options.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested replies">
                    {message.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onOptionSelect(option)}
                        className="min-h-[44px] px-4 py-2 rounded-full border border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--primary))]/10 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
