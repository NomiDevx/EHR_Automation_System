'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';
import { Button, Input, Textarea } from '@/components/ui';
import { MessageSquare, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MessagesClientProps {
  messages: any[];
  currentUserId: string;
  providers: { id: string; first_name: string; last_name: string; specialty: string | null }[];
  patientId: string | null;
  defaultRecipientId?: string;
}

export function MessagesClient({ messages, currentUserId, providers, patientId, defaultRecipientId = '' }: MessagesClientProps) {
  const [composing, setComposing] = useState(!!defaultRecipientId);
  const [form, setForm] = useState({ recipient_id: defaultRecipientId, subject: '', body: '' });

  useEffect(() => {
    if (defaultRecipientId) {
      setForm(f => ({ ...f, recipient_id: defaultRecipientId }));
      setComposing(true);
    }
  }, [defaultRecipientId]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const { error: e } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: form.recipient_id,
        patient_id: patientId,
        subject: form.subject || null,
        body: form.body,
        status: 'sent',
      });
      if (e) throw e;
      setComposing(false);
      setForm({ recipient_id: '', subject: '', body: '' });
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compose button */}
      <div className="flex justify-end">
        <Button onClick={() => setComposing(!composing)} variant={composing ? 'secondary' : 'primary'} id="compose-btn">
          <MessageSquare className="w-4 h-4" />
          {composing ? 'Cancel' : 'New Message'}
        </Button>
      </div>

      {/* Compose form */}
      {composing && (
        <div className="card animate-slide-up">
          <h2 className="text-sm font-semibold mb-4">New Message</h2>
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">To (Provider)</label>
              <select id="msg-recipient" className="input mt-1 w-full" required value={form.recipient_id}
                onChange={e => setForm(f => ({ ...f, recipient_id: e.target.value }))}>
                <option value="">Select provider…</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>Dr. {p.first_name} {p.last_name}{p.specialty ? ` — ${p.specialty}` : ''}</option>
                ))}
              </select>
            </div>
            <Input id="msg-subject" label="Subject (optional)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            <Textarea id="msg-body" label="Message *" required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Type your message…" />
            {error && <div className="alert-error">{error}</div>}
            <Button type="submit" loading={sending} id="send-msg-btn">
              <Send className="w-4 h-4" /> Send
            </Button>
          </form>
        </div>
      )}

      {/* Message list */}
      <div className="space-y-3">
        {messages.map((msg) => {
          const isOutbound = msg.sender_id === currentUserId;
          return (
        <div key={msg.id} className={cn('card', isOutbound ? 'border-blue-500/20 bg-blue-500/5' : '')}>
              <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 mb-2">
                <div className="min-w-0">
                  {msg.subject && <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{msg.subject}</p>}
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {isOutbound
                      ? `To: Dr. ${msg.recipient?.last_name}`
                      : `From: Dr. ${msg.sender?.last_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isOutbound && !msg.read_at && (
                    <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">Unread</span>
                  )}
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelative(msg.created_at)}</span>
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap break-words">{msg.body}</p>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
