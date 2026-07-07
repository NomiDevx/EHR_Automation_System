'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { Button, Textarea } from '@/components/ui';
import { Lock, Save, AlertTriangle } from 'lucide-react';
import type { ClinicalNote } from '@/lib/types/database';

interface SOAPEditorProps {
  patientId: string;
  appointmentId?: string;
  existingNote?: ClinicalNote;
  providerId: string;
}


export function SOAPEditor({ patientId, appointmentId, existingNote, providerId }: SOAPEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addendum, setAddendum] = useState('');
  const [addingAddendum, setAddingAddendum] = useState(false);

  const isLocked = existingNote?.status === 'signed';

  const [form, setForm] = useState({
    subjective: existingNote?.subjective ?? '',
    objective: existingNote?.objective ?? '',
    assessment: existingNote?.assessment ?? '',
    plan: existingNote?.plan ?? '',
  });

  const supabase = createClient();

  const saveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, patient_id: patientId, provider_id: providerId, appointment_id: appointmentId ?? null, status: 'draft' as const };

      if (existingNote) {
        const { error: e } = await supabase.from('clinical_notes').update(payload).eq('id', existingNote.id);
        if (e) throw e;
        await logAudit({ action: 'update', tableName: 'clinical_notes', recordId: existingNote.id, patientId });
      } else {
        const { error: e } = await supabase.from('clinical_notes').insert(payload);
        if (e) throw e;
        await logAudit({ action: 'create', tableName: 'clinical_notes', patientId });
      }
      router.push(`/clinical/patients/${patientId}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const signNote = async () => {
    setSigning(true);
    setError(null);
    try {
      const payload = {
        ...form,
        status: 'signed' as const,
        signed_at: new Date().toISOString(),
        signed_by: providerId,
      };

      if (existingNote) {
        const { error: e } = await supabase.from('clinical_notes').update(payload).eq('id', existingNote.id);
        if (e) throw e;
        await logAudit({ action: 'sign', tableName: 'clinical_notes', recordId: existingNote.id, patientId });
      } else {
        const { data, error: e } = await supabase.from('clinical_notes').insert({ ...payload, patient_id: patientId, provider_id: providerId, appointment_id: appointmentId ?? null }).select().single();
        if (e) throw e;
        await logAudit({ action: 'sign', tableName: 'clinical_notes', recordId: data?.id, patientId });
      }
      router.push(`/clinical/patients/${patientId}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to sign note');
    } finally {
      setSigning(false);
      setConfirmSign(false);
    }
  };

  const submitAddendum = async () => {
    if (!existingNote || !addendum.trim()) return;
    setAddingAddendum(true);
    try {
      const existing = (existingNote.addenda ?? []) as any[];
      const newAddenda = [...existing, { author_id: providerId, text: addendum, created_at: new Date().toISOString() }];
      const { error: e } = await supabase.from('clinical_notes').update({ addenda: newAddenda }).eq('id', existingNote.id);
      if (e) throw e;
      await logAudit({ action: 'update', tableName: 'clinical_notes', recordId: existingNote.id, patientId, changes: { addendum_added: true } });
      router.refresh();
      setAddendum('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingAddendum(false);
    }
  };

  const sections = [
    { key: 'subjective', label: 'Subjective', abbr: 'S', hint: "Patient's reported symptoms, history, complaint" },
    { key: 'objective', label: 'Objective', abbr: 'O', hint: 'Exam findings, vitals, measurements, test results' },
    { key: 'assessment', label: 'Assessment', abbr: 'A', hint: 'Diagnosis, differential diagnoses, clinical impression' },
    { key: 'plan', label: 'Plan', abbr: 'P', hint: 'Treatment plan, orders, referrals, patient education, follow-up' },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl">
      {isLocked && (
        <div className="alert-warning">
          <Lock className="w-4 h-4 shrink-0" />
          <span>This note is signed and locked. No edits are permitted. You may add an addendum below.</span>
        </div>
      )}

      {/* SOAP sections */}
      <div className="space-y-4">
        {sections.map(({ key, label, abbr, hint }) => (
          <div key={key} className="card">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-bold flex items-center justify-center">
                {abbr}
              </span>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>
              </div>
            </div>
            <textarea
              id={`soap-${key}`}
              value={form[key]}
              onChange={(e) => !isLocked && setForm(f => ({ ...f, [key]: e.target.value }))}
              disabled={isLocked}
              rows={4}
              placeholder={hint}
              className={`input resize-y w-full ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* Addenda (signed notes only) */}
      {isLocked && (
        <div className="card">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Add Addendum</p>
          {existingNote?.addenda && (existingNote.addenda as any[]).length > 0 && (
            <div className="space-y-2 mb-4">
              {(existingNote.addenda as any[]).map((a, i) => (
                <div key={i} className="pl-3 border-l-2 border-blue-500/30">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Addendum {i + 1} · {new Date(a.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-[hsl(var(--foreground))] mt-0.5">{a.text}</p>
                </div>
              ))}
            </div>
          )}
          <Textarea
            id="addendum-text"
            value={addendum}
            onChange={(e) => setAddendum(e.target.value)}
            rows={3}
            placeholder="Enter addendum text…"
            label="Addendum"
          />
          <Button onClick={submitAddendum} loading={addingAddendum} variant="secondary" className="mt-2" id="submit-addendum-btn">
            <Save className="w-4 h-4" /> Save Addendum
          </Button>
        </div>
      )}

      {/* Error */}
      {error && <div className="alert-error">{error}</div>}

      {/* Actions (draft notes only) */}
      {!isLocked && (
        <div className="flex items-center gap-3">
          <Button onClick={saveDraft} loading={saving} variant="secondary" id="save-draft-btn">
            <Save className="w-4 h-4" /> Save Draft
          </Button>
          <Button onClick={() => setConfirmSign(true)} variant="primary" id="sign-note-btn">
            <Lock className="w-4 h-4" /> Sign & Lock Note
          </Button>
        </div>
      )}

      {/* Confirm sign dialog */}
      {confirmSign && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full animate-slide-up">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Sign & Lock Note?</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Once signed, this note cannot be edited. Only addenda can be appended.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setConfirmSign(false)} variant="secondary" size="sm">Cancel</Button>
              <Button onClick={signNote} loading={signing} size="sm" id="confirm-sign-btn">
                <Lock className="w-3.5 h-3.5" /> Confirm Sign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
