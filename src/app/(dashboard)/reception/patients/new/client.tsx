'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { Input, Button, Select } from '@/components/ui';
import { User } from 'lucide-react';

interface RegisterPatientFormProps {
  providers: { id: string; first_name: string; last_name: string; specialty: string | null }[];
  createdById: string;
}

export function RegisterPatientForm({ providers, createdById }: RegisterPatientFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', gender: 'male',
    email: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', zip_code: '',
    emergency_name: '', emergency_relationship: '', emergency_phone: '',
    insurance_provider: '', insurance_policy_num: '', insurance_group_num: '',
    primary_provider_id: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.from('patients').insert({
        ...form,
        primary_provider_id: form.primary_provider_id || null,
        created_by: createdById,
        consent_obtained: false,
      }).select().single();
      if (e) throw e;
      await logAudit({ action: 'create', tableName: 'patients', recordId: data?.id, patientId: data?.id });
      router.push(`/clinical/patients/${data?.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to register patient');
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-Binary' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const Field = ({ label, id, ...props }: any) => (
    <Input label={label} id={id} value={form[id as keyof typeof form]} onChange={set(id)} {...props} />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Demographics */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-blue-400" /><h2 className="text-sm font-semibold">Demographics</h2></div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *" id="first_name" required />
          <Field label="Last Name *" id="last_name" required />
          <Field label="Date of Birth *" id="date_of_birth" type="date" required />
          <Select label="Gender *" id="gender" value={form.gender} onChange={set('gender')} options={genderOptions} />
          <Field label="Email" id="email" type="email" className="col-span-2 sm:col-span-1" />
          <Field label="Phone" id="phone" type="tel" />
        </div>
      </div>

      {/* Address */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Address</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address Line 1" id="address_line1" className="col-span-2" />
          <Field label="Address Line 2" id="address_line2" className="col-span-2" />
          <Field label="City" id="city" />
          <Field label="State" id="state" />
          <Field label="ZIP Code" id="zip_code" />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" id="emergency_name" />
          <Field label="Relationship" id="emergency_relationship" placeholder="Spouse, Parent, etc." />
          <Field label="Phone" id="emergency_phone" type="tel" />
        </div>
      </div>

      {/* Insurance */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Insurance</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Insurance Provider" id="insurance_provider" />
          <Field label="Policy Number" id="insurance_policy_num" />
          <Field label="Group Number" id="insurance_group_num" />
        </div>
      </div>

      {/* Provider */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Care Assignment</h2>
        <Select label="Primary Provider" id="primary-provider" value={form.primary_provider_id}
          onChange={(e) => setForm(f => ({ ...f, primary_provider_id: e.target.value }))}
          options={[{ value: '', label: 'Unassigned' }, ...providers.map(p => ({ value: p.id, label: `Dr. ${p.first_name} ${p.last_name}${p.specialty ? ` — ${p.specialty}` : ''}` }))]} />
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" loading={saving} id="register-submit-btn">Register Patient</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
