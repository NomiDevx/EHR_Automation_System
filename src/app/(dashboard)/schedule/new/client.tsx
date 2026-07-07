'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { Input, Button, Select, Textarea } from '@/components/ui';
import { CalendarPlus, AlertTriangle } from 'lucide-react';

interface BookAppointmentFormProps {
  patients: { id: string; first_name: string; last_name: string; mrn: string }[];
  providers: { id: string; first_name: string; last_name: string; specialty: string | null }[];
  createdById: string;
}

export function BookAppointmentForm({ patients, providers, createdById }: BookAppointmentFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    patient_id: '',
    provider_id: '',
    type: 'follow_up',
    scheduled_at: '',
    duration_mins: '30',
    chief_complaint: '',
    notes: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Conflict detection: check if provider has an overlapping appointment
  const checkConflict = async (scheduledAt: string, providerId: string, durationMins: number) => {
    if (!scheduledAt || !providerId) return;
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMins * 60000);

    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_mins, patient:patients(first_name, last_name)')
      .eq('provider_id', providerId)
      .not('status', 'in', '("cancelled","no_show")')
      .gte('scheduled_at', new Date(start.getTime() - 90 * 60000).toISOString())
      .lte('scheduled_at', end.toISOString());

    const overlap = data?.find((a: any) => {
      const aStart = new Date(a.scheduled_at);
      const aEnd = new Date(aStart.getTime() + a.duration_mins * 60000);
      return start < aEnd && end > aStart;
    });

    if (overlap) {
      const pt = overlap.patient as any;
      setConflict(`Conflict: Provider already has an appointment with ${pt?.first_name} ${pt?.last_name} at that time.`);
    } else {
      setConflict(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict) return;
    setSaving(true);
    setError(null);
    try {
      const { error: e } = await supabase.from('appointments').insert({
        patient_id: form.patient_id,
        provider_id: form.provider_id,
        type: form.type as any,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_mins: parseInt(form.duration_mins),
        chief_complaint: form.chief_complaint || null,
        notes: form.notes || null,
        created_by: createdById,
        status: 'scheduled',
      });
      if (e) throw e;
      await logAudit({ action: 'create', tableName: 'appointments', patientId: form.patient_id });
      router.push('/schedule');
    } catch (e: any) {
      setError(e.message ?? 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Appointment Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select id="appt-patient" label="Patient *" required value={form.patient_id} onChange={set('patient_id')}
            options={[{ value: '', label: 'Select patient…' }, ...patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name} (${p.mrn})` }))]}
            className="col-span-2" />
          <Select id="appt-provider" label="Provider *" required value={form.provider_id} onChange={set('provider_id')}
            options={[{ value: '', label: 'Select provider…' }, ...providers.map(p => ({ value: p.id, label: `Dr. ${p.first_name} ${p.last_name}${p.specialty ? ` — ${p.specialty}` : ''}` }))]}
            className="col-span-2" />
          <Select id="appt-type" label="Appointment Type" value={form.type} onChange={set('type')}
            options={[
              { value: 'new_patient', label: 'New Patient' },
              { value: 'follow_up', label: 'Follow Up' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'telehealth', label: 'Telehealth' },
              { value: 'procedure', label: 'Procedure' },
              { value: 'wellness', label: 'Wellness / Physical' },
            ]} />
          <Select id="appt-duration" label="Duration" value={form.duration_mins} onChange={set('duration_mins')}
            options={[15,20,30,45,60,90,120].map(m => ({ value: String(m), label: `${m} minutes` }))} />
          <Input id="appt-datetime" label="Date & Time *" type="datetime-local" required value={form.scheduled_at}
            onChange={(e) => {
              set('scheduled_at')(e);
              checkConflict(e.target.value, form.provider_id, parseInt(form.duration_mins));
            }}
            className="col-span-2" />
          <Input id="appt-complaint" label="Chief Complaint" value={form.chief_complaint} onChange={set('chief_complaint')} placeholder="Reason for visit" className="col-span-2" />
        </div>
        <div className="mt-4">
          <Textarea id="appt-notes" label="Notes (internal)" value={form.notes} onChange={set('notes')} rows={2} />
        </div>
      </div>

      {conflict && (
        <div className="alert-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{conflict}</span>
        </div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" loading={saving} disabled={!!conflict} id="book-appt-btn">
          <CalendarPlus className="w-4 h-4" /> Book Appointment
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
