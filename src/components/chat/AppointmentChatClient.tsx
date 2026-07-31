'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sendAgentMessage } from '@/lib/agent/api';
import { getOrCreateSessionId } from '@/lib/agent/session';
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  speak,
  stopSpeaking,
} from '@/lib/agent/speech';
import { AgentApiError } from '@/lib/agent/types';
import { cn } from '@/lib/utils';
import { ChatAccessibilityBar } from './ChatAccessibilityBar';
import { ChatInputBar } from './ChatInputBar';
import { ChatMessageList, type ChatMessage } from './ChatMessageList';
import { TalkToHumanButton } from './TalkToHumanButton';

import { createClient } from '@/lib/supabase/client';
import { Lock, LogIn } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEYS = {
  autoRead: 'ehr_chat_auto_read',
  largeFont: 'ehr_chat_large_font',
  highContrast: 'ehr_chat_high_contrast',
} as const;

function readBoolPref(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored === 'true';
}

function writeBoolPref(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

import { ChatHistoryModal } from './ChatHistoryModal';

export function AppointmentChatClient() {
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoReadAloud, setAutoReadAloud] = useState(true);
  const [largeFont, setLargeFont] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const speechControllerRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);
  const sendMessageRef = useRef<(text: string, options?: { isRetry?: boolean }) => Promise<void>>(
    async () => {},
  );
  const speechSupported = isSpeechRecognitionSupported();

  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user;
      setIsAuthenticated(!!user);
      if (user?.id) setCurrentUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const user = session?.user;
      setIsAuthenticated(!!user);
      if (user?.id) setCurrentUserId(user.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setIsAgentSpeaking(false);
  }, []);

  useEffect(() => {
    const activeId = getOrCreateSessionId();
    if (activeId && !sessionId) {
      setSessionId(activeId);
    }
    setAutoReadAloud(readBoolPref(STORAGE_KEYS.autoRead, true));
    setLargeFont(readBoolPref(STORAGE_KEYS.largeFont, false));
    setHighContrast(readBoolPref(STORAGE_KEYS.highContrast, false));
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text: string, options?: { isRetry?: boolean }) => {
      const trimmed = text.trim();
      const activeSessionId = sessionId || getOrCreateSessionId();

      if (!trimmed || !activeSessionId || isLoading) return;

      // Stop any active speech output when user sends a new message
      handleStopSpeaking();

      if (!options?.isRetry) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'user', text: trimmed },
        ]);
        setInput('');
        setInterimTranscript('');
      }

      setIsLoading(true);
      setError(null);
      setLastFailedMessage(trimmed);

      try {
        const response = await sendAgentMessage(activeSessionId, trimmed, currentUserId);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'bot',
            text: response.reply,
            options: response.options.length > 0 ? response.options : undefined,
          },
        ]);
        setLastFailedMessage(null);

        // Read out loud when autoReadAloud is active
        if (autoReadAloud) {
          speak(
            response.reply,
            () => setIsAgentSpeaking(true),
            () => setIsAgentSpeaking(false),
          );
        }
      } catch (err) {
        const message =
          err instanceof AgentApiError
            ? err.message
            : 'Something went wrong. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, autoReadAloud, handleStopSpeaking, currentUserId],
  );

  sendMessageRef.current = sendMessage;

  useEffect(() => {
    speechControllerRef.current = createSpeechRecognition(
      (transcript) => {
        // Feed final transcript into the input textfield first
        setInput(transcript);
        setInterimTranscript('');
        // Brief 600ms delay so user visually sees the recognized text in the field before submitting
        setTimeout(() => {
          void sendMessageRef.current(transcript);
        }, 600);
      },
      (message) => {
        setError(message);
        setInterimTranscript('');
      },
      () => {
        setIsListening(false);
      },
      (interim) => {
        // Stream interim spoken words live into input textfield & banner
        setInterimTranscript(interim);
        setInput(interim);
      },
    );

    return () => {
      speechControllerRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  const handleSend = () => {
    void sendMessage(input);
  };

  const handleRetry = () => {
    if (!lastFailedMessage) return;
    void sendMessage(lastFailedMessage, { isRetry: true });
  };

  const handleMicToggle = () => {
    const controller = speechControllerRef.current;
    if (!controller?.isSupported) return;

    if (isListening) {
      controller.stop();
      setIsListening(false);
      return;
    }

    // Silence any active agent voice playback when user turns on mic
    handleStopSpeaking();
    setError(null);
    setIsListening(true);
    controller.start();
  };

  const handleLargeFontChange = (value: boolean) => {
    setLargeFont(value);
    writeBoolPref(STORAGE_KEYS.largeFont, value);
  };

  const handleHighContrastChange = (value: boolean) => {
    setHighContrast(value);
    writeBoolPref(STORAGE_KEYS.highContrast, value);
  };

  const handleAutoReadAloudChange = (value: boolean) => {
    setAutoReadAloud(value);
    writeBoolPref(STORAGE_KEYS.autoRead, value);
    if (!value) {
      handleStopSpeaking();
    }
  };

  if (isAuthenticated === false) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl shadow-xl text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Authentication Required
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            Please sign in to chat with our appointment assistant and book your visit.
          </p>
        </div>

        <Link
          href="/login?next=/assistant"
          className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-6 py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:brightness-110 transition-all shadow-md"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In to Book Appointment</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative max-w-3xl mx-auto w-full">
      <div
        className={cn(
          'flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[800px]',
          'bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-lg',
        )}
        data-large-font={largeFont ? 'true' : 'false'}
        data-high-contrast={highContrast ? 'true' : 'false'}
      >
        <ChatAccessibilityBar
          largeFont={largeFont}
          highContrast={highContrast}
          autoReadAloud={autoReadAloud}
          isSpeaking={isAgentSpeaking}
          onLargeFontChange={handleLargeFontChange}
          onHighContrastChange={handleHighContrastChange}
          onAutoReadAloudChange={handleAutoReadAloudChange}
          onStopSpeaking={handleStopSpeaking}
          onOpenHistory={() => setShowHistoryModal(true)}
        />

        {error && (
          <div
            className="mx-4 mt-4 alert-error flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            role="alert"
            aria-live="assertive"
          >
            <p>{error}</p>
            {lastFailedMessage && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] text-sm font-medium hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--destructive))] shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          onOptionSelect={(option) => void sendMessage(option)}
        />

        <ChatInputBar
          input={input}
          interimTranscript={interimTranscript}
          isLoading={isLoading}
          isListening={isListening}
          speechSupported={speechSupported}
          onInputChange={setInput}
          onSend={handleSend}
          onMicToggle={handleMicToggle}
        />
      </div>

      <TalkToHumanButton />

      <ChatHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}
