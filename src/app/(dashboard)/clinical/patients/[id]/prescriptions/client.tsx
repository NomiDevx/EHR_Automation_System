'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { Input, Button, Select, Textarea } from '@/components/ui';
import { AlertTriangle, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';

// ⚠️ Drug interaction warning stub
// In production, integrate with a real drug interaction API (e.g., OpenFDA, DrugBank)
const INTERACTION_STUB_DRUGS = ['warfarin', 'metformin', 'lisinopril', 'simvastatin', 'aspirin', 'ibuprofen'];

interface PrescriptionFormClientProps {
  patientId: string;
  prescriberId: string;
  allergies: { allergen: string; severity: string }[];
}

export function PrescriptionFormClient({ patientId, prescriberId, allergies }: PrescriptionFormClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    drug_name: '',
    drug_generic_name: '',
    dosage: '',
    frequency: '',
    route: 'oral',
    quantity: '',
    refills_allowed: '0',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    instructions: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [key]: val }));

    // Stub interaction check
    if (key === 'drug_name' || key === 'drug_generic_name') {
      const drugLower = val.toLowerCase();
      const hit = INTERACTION_STUB_DRUGS.find(d => drugLower.includes(d));
      if (hit) {
        setInteractionWarning(`⚠️ Stub warning: ${hit} may have interactions with common medications. In production, verify with a drug interaction database.`);
      } else {
        setInteractionWarning(null);
      }
    }
  };

  const allergyWarning = form.drug_name
    ? allergies.find(a => form.drug_name.toLowerCase().includes(a.allergen.toLowerCase()) ||
        a.allergen.toLowerCase().includes(form.drug_name.toLowerCase()))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        patient_id: patientId,
        prescriber_id: prescriberId,
        drug_name: form.drug_name,
        drug_generic_name: form.drug_generic_name || null,
        dosage: form.dosage,
        frequency: form.frequency,
        route: form.route,
        quantity: form.quantity ? parseInt(form.quantity) : null,
        refills_allowed: parseInt(form.refills_allowed),
        refills_remaining: parseInt(form.refills_allowed),
        start_date: form.start_date,
        end_date: form.end_date || null,
        instructions: form.instructions || null,
        interaction_flagged: !!interactionWarning,
        interaction_notes: interactionWarning ?? null,
        status: 'active',
      };
      const { error: e } = await supabase.from('prescriptions').insert(payload);
      if (e) throw e;
      await logAudit({ action: 'create', tableName: 'prescriptions', patientId });
      router.push(`/clinical/patients/${patientId}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const freqOptions = [
    { value: 'once daily', label: 'Once daily' },
    { value: 'twice daily', label: 'Twice daily (BID)' },
    { value: 'three times daily', label: 'Three times daily (TID)' },
    { value: 'four times daily', label: 'Four times daily (QID)' },
    { value: 'every 6 hours', label: 'Every 6 hours' },
    { value: 'every 8 hours', label: 'Every 8 hours' },
    { value: 'every 12 hours', label: 'Every 12 hours' },
    { value: 'as needed', label: 'As needed (PRN)' },
    { value: 'once weekly', label: 'Once weekly' },
  ];

  const routeOptions = [
    { value: 'oral', label: 'Oral (PO)' },
    { value: 'intravenous', label: 'Intravenous (IV)' },
    { value: 'intramuscular', label: 'Intramuscular (IM)' },
    { value: 'subcutaneous', label: 'Subcutaneous (SubQ)' },
    { value: 'topical', label: 'Topical' },
    { value: 'sublingual', label: 'Sublingual (SL)' },
    { value: 'inhaled', label: 'Inhaled' },
    { value: 'nasal', label: 'Nasal' },
    { value: 'ophthalmic', label: 'Ophthalmic' },
    { value: 'rectal', label: 'Rectal' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Allergy warning */}
      {allergyWarning && (
        <div className="alert-error">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Allergy Alert:</strong> Patient has a {allergyWarning.severity} allergy to{' '}
            <strong>{allergyWarning.allergen}</strong>. Verify before prescribing.
          </span>
        </div>
      )}

      {/* Drug interaction stub warning */}
      {interactionWarning && !allergyWarning && (
        <div className="alert-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{interactionWarning}</span>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Prescription Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input id="rx-drug-name" label="Drug Name (Brand) *" required value={form.drug_name} onChange={set('drug_name')} placeholder="e.g., Lisinopril" className="col-span-2 sm:col-span-1" />
          <Input id="rx-generic" label="Generic Name" value={form.drug_generic_name} onChange={set('drug_generic_name')} placeholder="e.g., Lisinopril" />
          <Input id="rx-dosage" label="Dosage *" required value={form.dosage} onChange={set('dosage')} placeholder="e.g., 10mg" />
          <Select id="rx-frequency" label="Frequency *" required value={form.frequency} onChange={set('frequency')}
            options={[{ value: '', label: 'Select frequency…' }, ...freqOptions]} />
          <Select id="rx-route" label="Route" value={form.route} onChange={set('route')} options={routeOptions} />
          <Input id="rx-quantity" label="Quantity (pills/units)" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          <Input id="rx-refills" label="Refills Allowed" type="number" min="0" max="12" value={form.refills_allowed} onChange={set('refills_allowed')} />
          <Input id="rx-start" label="Start Date *" type="date" required value={form.start_date} onChange={set('start_date')} />
          <Input id="rx-end" label="End Date (optional)" type="date" value={form.end_date} onChange={set('end_date')} />
        </div>
        <div className="mt-4">
          <Textarea id="rx-instructions" label="Patient Instructions" value={form.instructions} onChange={set('instructions')} rows={3} placeholder="Sig instructions, special directions…" />
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" loading={saving} id="submit-rx-btn">
          <Pill className="w-4 h-4" /> Submit Prescription
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
