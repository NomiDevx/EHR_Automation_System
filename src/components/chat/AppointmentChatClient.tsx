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
    async (textToSend: string, options?: { isRetry?: boolean }) => {
      const cleanText = textToSend.trim();
      if (!cleanText || isLoading) return;

      handleStopSpeaking();
      setError(null);
      setLastFailedMessage(null);

      if (!options?.isRetry) {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          text: cleanText,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
      }

      setIsLoading(true);

      try {
        const activeSessionId = sessionId || getOrCreateSessionId();
        if (!sessionId && activeSessionId) {
          setSessionId(activeSessionId);
        }

        const response = await sendAgentMessage(cleanText, activeSessionId, currentUserId);

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'bot',
          text: response.reply,
          options: (response as any).options ?? undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (autoReadAloud && response.reply) {
          setIsAgentSpeaking(true);
          speak(response.reply, () => setIsAgentSpeaking(false));
        }
      } catch (err) {
        setLastFailedMessage(cleanText);
        if (err instanceof AgentApiError) {
          setError(err.message);
        } else {
          setError('Communication error. Please check your connection and try again.');
        }
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
        setInput(transcript);
        setInterimTranscript('');
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
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E2E8F0] rounded-3xl shadow-xl text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2]">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-cambria text-2xl font-bold text-[#0B2A55]">
            Authentication Required
          </h2>
          <p className="text-xs text-[#475569] leading-relaxed">
            Please sign in to your MediSynx patient account to chat with our AI booking assistant.
          </p>
        </div>

        <Link
          href="/login?next=/assistant"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white font-bold text-xs hover:opacity-95 transition-all shadow-md"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Access Assistant</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto w-full">
      <div
        className={cn(
          'flex flex-col h-[calc(100vh-210px)] min-h-[580px]',
          'bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-xl',
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
            className="mx-4 mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            role="alert"
            aria-live="assertive"
          >
            <p>{error}</p>
            {lastFailedMessage && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shrink-0"
              >
                Retry Message
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
