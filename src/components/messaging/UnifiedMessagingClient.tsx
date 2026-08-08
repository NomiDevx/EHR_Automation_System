'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';
import { MessageSquare, Send, Search, CheckCheck, ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface MessagingContact {
  id: string; // profile_id
  name: string;
  subTitle?: string;
  role: 'doctor' | 'nurse' | 'patient' | 'admin' | 'receptionist';
  avatar_url?: string;
  patientId?: string;
}

interface UnifiedMessagingClientProps {
  messages: any[];
  currentUserId: string;
  contacts: MessagingContact[];
  defaultRecipientId?: string;
  isStaff?: boolean;
}

export function UnifiedMessagingClient({
  messages: initialMessages,
  currentUserId,
  contacts,
  defaultRecipientId = '',
  isStaff = false,
}: UnifiedMessagingClientProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [selectedContactId, setSelectedContactId] = useState<string>(
    defaultRecipientId || (contacts[0]?.id ?? '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile navigation state
  const [showMobileThread, setShowMobileThread] = useState<boolean>(
    Boolean(defaultRecipientId)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Sync initial props
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (defaultRecipientId) {
      setSelectedContactId(defaultRecipientId);
      setShowMobileThread(true);
    }
  }, [defaultRecipientId]);

  // Real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel('unified_realtime_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const newMsg = payload.new;
          if (newMsg.sender_id === currentUserId || newMsg.recipient_id === currentUserId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [newMsg, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const updatedMsg = payload.new;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  // Map contact IDs to their most recent message timestamp for sorting
  const contactLatestTimestamps = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      const otherId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
      const time = new Date(m.created_at).getTime();
      if (!map[otherId] || time > map[otherId]) {
        map[otherId] = time;
      }
    });
    return map;
  }, [messages, currentUserId]);

  // Filter & sort contacts based on search query & latest message time (most recent first)
  const filteredContacts = useMemo(() => {
    return [...contacts]
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.subTitle && c.subTitle.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const timeA = contactLatestTimestamps[a.id] || 0;
        const timeB = contactLatestTimestamps[b.id] || 0;
        if (timeA !== timeB) return timeB - timeA;
        return a.name.localeCompare(b.name);
      });
  }, [contacts, searchQuery, contactLatestTimestamps]);

  // Get active contact
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId) || contacts[0];
  }, [contacts, selectedContactId]);

  // Get messages thread between currentUserId and selectedContactId sorted chronologically (oldest top, newest bottom)
  const currentThread = useMemo(() => {
    if (!selectedContactId) return [];
    return messages
      .filter(
        (m) =>
          (m.sender_id === currentUserId && m.recipient_id === selectedContactId) ||
          (m.sender_id === selectedContactId && m.recipient_id === currentUserId)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, currentUserId, selectedContactId]);

  // Auto-scroll to bottom of thread messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread]);

  // Mark unread messages in thread as read
  useEffect(() => {
    if (!selectedContactId) return;

    const unreadMsgIds = currentThread
      .filter((m) => m.recipient_id === currentUserId && !m.read_at)
      .map((m) => m.id);

    if (unreadMsgIds.length > 0) {
      supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMsgIds)
        .then(() => {
          setMessages((prev) =>
            prev.map((m) =>
              unreadMsgIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
            )
          );
        });
    }
  }, [selectedContactId, currentThread, currentUserId, supabase]);

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setShowMobileThread(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = inputText.trim();
    if (!body || !selectedContactId) return;

    setSending(true);
    setError(null);

    try {
      const newMsgObj = {
        sender_id: currentUserId,
        recipient_id: selectedContactId,
        patient_id: selectedContact?.patientId ?? null,
        subject: subjectText.trim() || null,
        body,
        status: 'sent',
      };

      const { data, error: sendErr } = await supabase
        .from('messages')
        .insert(newMsgObj)
        .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, role), recipient:profiles!messages_recipient_id_fkey(first_name, last_name, role)')
        .single();

      if (sendErr) throw sendErr;

      setMessages((prev) => [data, ...prev]);
      setInputText('');
      setSubjectText('');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E2E8F0] rounded-3xl p-4 sm:p-6 shadow-xl min-h-[600px] h-[calc(100vh-220px)]">

      {/* ── LEFT COLUMN: CONTACTS LIST & SEARCH ───────────────────── */}
      <div
        className={cn(
          'lg:col-span-4 border-r border-[#E2E8F0] pr-0 lg:pr-6 flex-col justify-between space-y-4 h-full overflow-hidden',
          showMobileThread ? 'hidden lg:flex' : 'flex'
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">
              {isStaff ? 'Patient Conversations' : 'Ask Doctor / Care Team'}
            </h2>
            <span className="text-xs font-bold text-[#0891B2] bg-[#0891B2]/10 px-2.5 py-0.5 rounded-full">
              {contacts.length} Contacts
            </span>
          </div>

          {/* Contact Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={isStaff ? 'Search patient name or MRN…' : 'Search doctor or specialty…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>
        </div>

        {/* Contacts Scrollable List (Sorted by Time) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContactId === contact.id;

            // Unread count for this contact
            const unreadCount = messages.filter(
              (m) => m.sender_id === contact.id && m.recipient_id === currentUserId && !m.read_at
            ).length;

            // Last message snippet
            const contactMsgs = messages
              .filter(
                (m) =>
                  (m.sender_id === currentUserId && m.recipient_id === contact.id) ||
                  (m.sender_id === contact.id && m.recipient_id === currentUserId)
              )
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const lastMsg = contactMsgs[0];

            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelectContact(contact.id)}
                className={`w-full p-3.5 rounded-2xl text-left transition-all duration-200 flex items-start gap-3 border ${
                  isSelected
                    ? 'bg-[#0891B2]/10 border-[#0891B2] shadow-sm ring-1 ring-[#0891B2]/30'
                    : 'bg-[#F8FAFC] border-[#F1F5F9] hover:bg-[#F1F5F9]'
                }`}
              >
                <div className="relative w-10 h-10 rounded-xl bg-[#0B2A55] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {contact.avatar_url ? (
                    <img src={contact.avatar_url} alt={contact.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{contact.name.split(' ').map((n) => n[0]).join('')}</span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0891B2] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-cambria font-bold text-xs text-[#0B2A55] truncate">
                      {contact.name}
                    </p>
                    {lastMsg && (
                      <span className="text-[10px] text-[#94A3B8] shrink-0">
                        {formatRelative(lastMsg.created_at)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#0891B2] font-semibold truncate">
                    {contact.subTitle || contact.role.toUpperCase()}
                  </p>

                  {lastMsg && (
                    <p className="text-[11px] text-[#475569] truncate mt-1">
                      {lastMsg.sender_id === currentUserId ? 'You: ' : ''}{lastMsg.body}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-xs text-[#94A3B8]">
              No contacts match search query
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: CHAT CONVERSATION THREAD ───────────────── */}
      <div
        className={cn(
          'lg:col-span-8 flex-col justify-between h-full overflow-hidden space-y-4',
          !showMobileThread ? 'hidden lg:flex' : 'flex'
        )}
      >
        {selectedContact ? (
          <>
            {/* Contact Top Header Bar */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setShowMobileThread(false)}
                  className="lg:hidden p-2 rounded-xl text-[#0B2A55] hover:bg-[#E2E8F0] transition-colors border border-[#CBD5E1]"
                  title="Back to contacts list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-10 h-10 rounded-xl bg-[#0B2A55] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedContact.avatar_url ? (
                    <img src={selectedContact.avatar_url} alt={selectedContact.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{selectedContact.name.split(' ').map((n) => n[0]).join('')}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-cambria text-sm font-bold text-[#0B2A55]">
                    {selectedContact.name}
                  </h3>
                  <p className="text-[11px] text-[#0891B2] font-semibold">
                    {selectedContact.subTitle || selectedContact.role.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#16A34A] bg-[#16A34A]/10 px-3 py-1 rounded-full border border-[#16A34A]/20">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                Active Messaging Thread
              </div>
            </div>

            {/* Chat Thread Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] scrollbar-thin">
              {currentThread.map((msg) => {
                const isOutbound = msg.sender_id === currentUserId;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-2xl space-y-1 shadow-sm ${
                        isOutbound
                          ? 'bg-[#0891B2] text-white rounded-br-none'
                          : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-none'
                      }`}
                    >
                      {msg.subject && (
                        <p className={`text-xs font-bold border-b pb-1 mb-1 ${isOutbound ? 'border-white/20 text-white' : 'border-[#E2E8F0] text-[#0B2A55]'}`}>
                          {msg.subject}
                        </p>
                      )}
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      <div
                        className={`flex items-center justify-end gap-1.5 text-[10px] pt-1 ${
                          isOutbound ? 'text-white/80' : 'text-[#94A3B8]'
                        }`}
                      >
                        <span>{formatRelative(msg.created_at)}</span>
                        {isOutbound && (
                          <CheckCheck className={`w-3.5 h-3.5 ${msg.read_at ? 'text-[#22D3EE]' : 'text-white/60'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentThread.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <MessageSquare className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
                  <h4 className="font-cambria text-base font-bold text-[#0B2A55]">No Messages Yet</h4>
                  <p className="text-xs text-[#475569]">
                    Type a message or question below to start your conversation with {selectedContact.name}.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="space-y-3 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Subject / Topic (Optional)"
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Ask ${selectedContact.name} a question or send a message…`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0891B2] shadow-sm"
                />

                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-2 disabled:opacity-50 shrink-0 active:scale-95 transition-all"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}
            </form>
          </>
        ) : (
          <div className="text-center py-20 space-y-3">
            <MessageSquare className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
            <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">Select a Contact</h3>
            <p className="text-xs text-[#475569]">Choose a doctor or patient from the left drawer to view conversation.</p>
          </div>
        )}
      </div>

    </div>
  );
}
