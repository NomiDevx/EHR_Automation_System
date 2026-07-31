'use client';

import { useState, useEffect } from 'react';
import { getUserChatHistory } from '@/app/actions';
import { History, X, Bot, User, Calendar, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSessionLog {
  sessionId: string;
  createdAt: string;
  messages: {
    id: string;
    senderRole: 'user' | 'agent';
    text: string;
    createdAt: string;
  }[];
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatHistoryModal({ isOpen, onClose }: ChatHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSessionLog[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getUserChatHistory().then((data: ChatSessionLog[]) => {
        setSessions(data);
        if (data.length > 0) {
          setSelectedSessionId(data[0].sessionId);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeSession = sessions.find((s) => s.sessionId === selectedSessionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                Previous Chat History
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Review all your past conversations with our AI Booking Assistant.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[hsl(var(--surface-hover))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-[hsl(var(--muted-foreground))]">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>Loading your chat history...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-[hsl(var(--muted-foreground))]">
            <MessageSquare className="w-12 h-12 stroke-[1.5] text-slate-500" />
            <p className="text-base font-semibold text-[hsl(var(--foreground))]">No previous chats found</p>
            <p className="text-sm max-w-md">
              Start chatting with the assistant to schedule your appointment. Your conversation history will appear here.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar — Session list */}
            <div className="w-full md:w-72 border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-y-auto p-3 space-y-2 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-2">
                Past Sessions ({sessions.length})
              </span>
              {sessions.map((session, idx) => {
                const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isSelected = session.sessionId === selectedSessionId;
                const firstUserMsg = session.messages.find((m) => m.senderRole === 'user')?.text || 'Appointment chat';

                return (
                  <button
                    key={session.sessionId}
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all text-xs space-y-1',
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm'
                        : 'bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))]'
                    )}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Session #{sessions.length - idx}</span>
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{dateStr}</span>
                    </div>
                    <p className="line-clamp-1 text-[hsl(var(--muted-foreground))] italic">
                      "{firstUserMsg}"
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {session.messages.length} messages
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Main message viewer */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-6 bg-[hsl(var(--surface))] space-y-4">
              {activeSession ? (
                <>
                  <div className="pb-3 border-b border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>Session ID: {activeSession.sessionId}</span>
                    <span>
                      {new Date(activeSession.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-4 flex-1">
                    {activeSession.messages.map((msg) => {
                      const isUser = msg.senderRole === 'user';
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={msg.id}
                          className={cn('flex items-start gap-3 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : '')}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold shadow-sm',
                              isUser ? 'bg-blue-600' : 'bg-slate-700'
                            )}
                          >
                            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
                          </div>

                          <div className="space-y-1">
                            <div
                              className={cn(
                                'p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                                isUser
                                  ? 'bg-blue-600 text-white rounded-tr-none'
                                  : 'bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-tl-none'
                              )}
                            >
                              {msg.text}
                            </div>
                            <span className={cn('text-[10px] text-[hsl(var(--muted-foreground))] block px-1', isUser ? 'text-right' : 'text-left')}>
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm">
                  Select a session from the left to view messages.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
