'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';
import { Button, Input, Textarea } from '@/components/ui';
import { MessageSquare, Send } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  profile_id: string | null;
}

interface ClinicalMessagesClientProps {
  messages: any[];
  currentUserId: string;
  patients: Patient[];
}

export function ClinicalMessagesClient({ messages, currentUserId, patients }: ClinicalMessagesClientProps) {
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ recipient_id: '', patient_id: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Patients who actually have portal accounts (profile_id is not null)
  const registeredPatients = patients.filter(p => p.profile_id !== null);

  useEffect(() => {
    const toPatientId = searchParams.get('to');
    if (toPatientId) {
      const p = patients.find(p => p.id === toPatientId);
      if (p && p.profile_id) {
        setForm(f => ({
          ...f,
          recipient_id: p.profile_id!,
          patient_id: p.id,
          subject: '',
          body: ''
        }));
        setComposing(true);
      }
    }
  }, [searchParams, patients]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      if (!form.recipient_id) {
        throw new Error('Please select a patient with a registered portal account.');
      }
      
      const { error: sendErr } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: form.recipient_id,
        patient_id: form.patient_id || null,
        subject: form.subject || null,
        body: form.body,
        status: 'sent',
      });
      if (sendErr) throw sendErr;
      
      setComposing(false);
      setForm({ recipient_id: '', patient_id: '', subject: '', body: '' });
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compose button */}
      <div className="flex justify-end">
        <Button onClick={() => setComposing(!composing)} variant={composing ? 'secondary' : 'primary'} id="clinical-compose-btn">
          <MessageSquare className="w-4 h-4" />
          {composing ? 'Cancel' : 'New Message to Patient'}
        </Button>
      </div>

      {/* Compose form */}
      {composing && (
        <div className="card animate-slide-up">
          <h2 className="text-sm font-semibold mb-4">New Secure Message</h2>
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">To (Patient with Portal Account)</label>
              <select
                id="clinical-msg-recipient"
                className="input mt-1 w-full text-xs"
                required
                value={form.patient_id}
                onChange={e => {
                  const val = e.target.value;
                  const p = patients.find(p => p.id === val);
                  setForm(f => ({
                    ...f,
                    patient_id: val,
                    recipient_id: p?.profile_id || ''
                  }));
                }}
              >
                <option value="">Select patient…</option>
                {registeredPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                ))}
              </select>
            </div>
            
            <Input
              id="clinical-msg-subject"
              label="Subject (optional)"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
            
            <Textarea
              id="clinical-msg-body"
              label="Message *"
              required
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="Type your message…"
            />
            
            {error && <div className="alert-error">{error}</div>}
            
            <Button type="submit" loading={sending} id="clinical-send-msg-btn">
              <Send className="w-4 h-4" /> Send Message
            </Button>
          </form>
        </div>
      )}

      {/* Message list */}
      <div className="space-y-3">
        {messages.map((msg) => {
          const isOutbound = msg.sender_id === currentUserId;
          const patientName = msg.patient
            ? `${msg.patient.first_name} ${msg.patient.last_name} (${msg.patient.mrn})`
            : isOutbound
            ? `${msg.recipient?.first_name} ${msg.recipient?.last_name}`
            : `${msg.sender?.first_name} ${msg.sender?.last_name}`;

          return (
            <div key={msg.id} className={cn('card', isOutbound ? 'border-blue-500/20 bg-blue-500/5' : '')}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  {msg.subject && <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{msg.subject}</p>}
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {isOutbound ? `To Patient: ${patientName}` : `From Patient: ${patientName}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isOutbound && !msg.read_at && (
                    <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">Unread</span>
                  )}
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelative(msg.created_at)}</span>
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{msg.body}</p>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No patient messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
