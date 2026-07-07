'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { Input, Button } from '@/components/ui';
import { Activity } from 'lucide-react';

interface VitalsFormClientProps {
  patientId: string;
  recordedById: string;
  appointmentId?: string;
}

export function VitalsFormClient({ patientId, recordedById, appointmentId }: VitalsFormClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature_f: '',
    weight_lbs: '',
    height_in: '',
    spo2_pct: '',
    pain_scale: '',
    notes: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        patient_id: patientId,
        recorded_by: recordedById,
        appointment_id: appointmentId ?? null,
        notes: form.notes || null,
      };
      const numFields = ['systolic_bp', 'diastolic_bp', 'heart_rate', 'respiratory_rate', 'temperature_f', 'weight_lbs', 'height_in', 'spo2_pct', 'pain_scale'];
      numFields.forEach(k => { if (form[k as keyof typeof form]) payload[k] = parseFloat(form[k as keyof typeof form] as string); });

      const { error: e } = await supabase.from('vitals').insert(payload);
      if (e) throw e;
      await logAudit({ action: 'create', tableName: 'vitals', patientId });
      router.push(`/clinical/patients/${patientId}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Vital Signs</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Blood Pressure</p>
            <div className="flex gap-2 items-center">
              <input id="vitals-systolic" type="number" placeholder="Systolic" value={form.systolic_bp} onChange={set('systolic_bp')} className="input" min="60" max="300" />
              <span className="text-[hsl(var(--muted-foreground))]">/</span>
              <input id="vitals-diastolic" type="number" placeholder="Diastolic" value={form.diastolic_bp} onChange={set('diastolic_bp')} className="input" min="30" max="200" />
              <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">mmHg</span>
            </div>
          </div>
          <Input id="vitals-hr" label="Heart Rate (bpm)" type="number" min="30" max="300" value={form.heart_rate} onChange={set('heart_rate')} />
          <Input id="vitals-rr" label="Respiratory Rate (breaths/min)" type="number" min="5" max="60" value={form.respiratory_rate} onChange={set('respiratory_rate')} />
          <Input id="vitals-temp" label="Temperature (°F)" type="number" step="0.1" min="90" max="110" value={form.temperature_f} onChange={set('temperature_f')} />
          <Input id="vitals-weight" label="Weight (lbs)" type="number" step="0.1" min="1" max="999" value={form.weight_lbs} onChange={set('weight_lbs')} />
          <Input id="vitals-height" label="Height (inches)" type="number" step="0.1" min="12" max="108" value={form.height_in} onChange={set('height_in')} />
          <Input id="vitals-spo2" label="SpO₂ (%)" type="number" min="50" max="100" value={form.spo2_pct} onChange={set('spo2_pct')} />
          <Input id="vitals-pain" label="Pain Scale (0–10)" type="number" min="0" max="10" value={form.pain_scale} onChange={set('pain_scale')} />
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Notes</label>
          <textarea id="vitals-notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Additional observations…" className="input mt-1 resize-none w-full" />
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" loading={saving} id="save-vitals-btn">Save Vitals</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
