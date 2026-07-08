'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPatientVital, addPatientAllergy } from '@/app/actions';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { 
  Activity, ShieldAlert, Plus, X, Heart, 
  Scale, Thermometer, AlertOctagon, Calendar 
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PortalRecordsClientProps {
  patientId: string;
  initialVitals: any[];
  initialAllergies: any[];
}

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'life_threatening', label: 'Life Threatening' },
];

const SEVERITY_BADGES = {
  mild: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  severe: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
  life_threatening: 'bg-red-500/10 text-red-400 border-red-500/25 animate-pulse',
};

export function PortalRecordsClient({ patientId, initialVitals, initialAllergies }: PortalRecordsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'vitals' | 'allergies'>('vitals');
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [allergiesModalOpen, setAllergiesModalOpen] = useState(false);

  // Vitals form state
  const [vitalsForm, setVitalsForm] = useState({
    systolicBp: '',
    diastolicBp: '',
    heartRate: '',
    respiratoryRate: '',
    temperatureF: '',
    weightLbs: '',
    heightIn: '',
    painScale: '0',
    notes: '',
  });
  const [vitalsPending, setVitalsPending] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  // Allergies form state
  const [allergiesForm, setAllergiesForm] = useState({
    allergen: '',
    reaction: '',
    severity: 'mild' as any,
    onsetDate: '',
  });
  const [allergiesPending, setAllergiesPending] = useState(false);
  const [allergiesError, setAllergiesError] = useState<string | null>(null);

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVitalsPending(true);
    setVitalsError(null);

    try {
      const payload = {
        patientId,
        systolicBp: vitalsForm.systolicBp ? parseInt(vitalsForm.systolicBp) : null,
        diastolicBp: vitalsForm.diastolicBp ? parseInt(vitalsForm.diastolicBp) : null,
        heartRate: vitalsForm.heartRate ? parseInt(vitalsForm.heartRate) : null,
        respiratoryRate: vitalsForm.respiratoryRate ? parseInt(vitalsForm.respiratoryRate) : null,
        temperatureF: vitalsForm.temperatureF ? parseFloat(vitalsForm.temperatureF) : null,
        weightLbs: vitalsForm.weightLbs ? parseFloat(vitalsForm.weightLbs) : null,
        heightIn: vitalsForm.heightIn ? parseFloat(vitalsForm.heightIn) : null,
        painScale: parseInt(vitalsForm.painScale),
        notes: vitalsForm.notes || null,
      };

      await addPatientVital(payload);
      setVitalsModalOpen(false);
      setVitalsForm({
        systolicBp: '',
        diastolicBp: '',
        heartRate: '',
        respiratoryRate: '',
        temperatureF: '',
        weightLbs: '',
        heightIn: '',
        painScale: '0',
        notes: '',
      });
      router.refresh();
    } catch (err: any) {
      setVitalsError(err.message || 'Failed to record vitals.');
    } finally {
      setVitalsPending(false);
    }
  };

  const handleAllergiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllergiesPending(true);
    setAllergiesError(null);

    try {
      await addPatientAllergy({
        patientId,
        allergen: allergiesForm.allergen,
        reaction: allergiesForm.reaction || null,
        severity: allergiesForm.severity,
        onsetDate: allergiesForm.onsetDate || null,
      });

      setAllergiesModalOpen(false);
      setAllergiesForm({
        allergen: '',
        reaction: '',
        severity: 'mild',
        onsetDate: '',
      });
      router.refresh();
    } catch (err: any) {
      setAllergiesError(err.message || 'Failed to record allergy.');
    } finally {
      setAllergiesPending(false);
    }
  };

  const calculateBmi = (wStr: string, hStr: string) => {
    const w = parseFloat(wStr);
    const h = parseFloat(hStr);
    if (!w || !h || h <= 0) return null;
    return ((w / (h * h)) * 703).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-[hsl(var(--border))]">
        <button
          onClick={() => setActiveTab('vitals')}
          className={cn(
            'px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2',
            activeTab === 'vitals'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          )}
        >
          <Activity className="w-4 h-4" /> Vitals & Measurements
        </button>
        <button
          onClick={() => setActiveTab('allergies')}
          className={cn(
            'px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2',
            activeTab === 'allergies'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          )}
        >
          <ShieldAlert className="w-4 h-4" /> Allergies
        </button>
      </div>

      {/* Tab: Vitals */}
      {activeTab === 'vitals' && (
        <Card className="space-y-5">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border-muted))] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">Logged Vitals History</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Track your blood pressure, temperature, weight, and general measurements.</p>
            </div>
            <Button onClick={() => setVitalsModalOpen(true)} className="text-xs flex items-center gap-1" id="log-vitals-btn">
              <Plus className="w-3.5 h-3.5" /> Log Vitals
            </Button>
          </div>

          {initialVitals.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-10 h-10 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No vitals on record yet. Log your first measurement above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Blood Pressure</th>
                    <th>Heart Rate</th>
                    <th>Temp</th>
                    <th>Weight</th>
                    <th>Height</th>
                    <th>BMI</th>
                    <th>Pain Scale</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {initialVitals.map((v) => (
                    <tr key={v.id}>
                      <td className="font-medium whitespace-nowrap">{formatDate(v.recorded_at, 'MMM d, yyyy h:mm a')}</td>
                      <td className="whitespace-nowrap">
                        {v.systolic_bp && v.diastolic_bp ? `${v.systolic_bp}/${v.diastolic_bp} mmHg` : '—'}
                      </td>
                      <td>{v.heart_rate ? `${v.heart_rate} bpm` : '—'}</td>
                      <td>{v.temperature_f ? `${v.temperature_f} °F` : '—'}</td>
                      <td>{v.weight_lbs ? `${v.weight_lbs} lbs` : '—'}</td>
                      <td>{v.height_in ? `${v.height_in} in` : '—'}</td>
                      <td className="font-semibold text-[hsl(var(--primary))]">{v.bmi ? v.bmi : '—'}</td>
                      <td>
                        {v.pain_scale !== null ? (
                          <span className={cn(
                            'badge text-[10px]',
                            v.pain_scale >= 7 ? 'bg-red-500/10 text-red-400' :
                            v.pain_scale >= 4 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                          )}>
                            {v.pain_scale}/10
                          </span>
                        ) : '—'}
                      </td>
                      <td className="max-w-[200px] truncate" title={v.notes}>{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Allergies */}
      {activeTab === 'allergies' && (
        <Card className="space-y-5">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border-muted))] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">Active Allergies</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">View and report allergies and sensitivities to inform clinical staff.</p>
            </div>
            <Button onClick={() => setAllergiesModalOpen(true)} className="text-xs flex items-center gap-1" id="add-allergy-btn">
              <Plus className="w-3.5 h-3.5" /> Report Allergy
            </Button>
          </div>

          {initialAllergies.length === 0 ? (
            <div className="text-center py-16">
              <ShieldAlert className="w-10 h-10 text-[hsl(var(--muted-foreground))]/30 mx-auto mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No allergies reported. Report any allergy or reaction above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Allergen</th>
                    <th>Severity</th>
                    <th>Reaction</th>
                    <th>Onset Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {initialAllergies.map((a) => (
                    <tr key={a.id}>
                      <td className="font-semibold text-[hsl(var(--foreground))]">{a.allergen}</td>
                      <td>
                        <span className={cn('badge text-[10px] border', SEVERITY_BADGES[a.severity as keyof typeof SEVERITY_BADGES])}>
                          {a.severity.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{a.reaction || '—'}</td>
                      <td>{a.onset_date ? formatDate(a.onset_date, 'MMMM d, yyyy') : '—'}</td>
                      <td>
                        <span className={cn('badge text-[10px]', a.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400')}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── Log Vitals Modal ────────────────────────────────────────── */}
      {vitalsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-[hsl(var(--border-muted))] flex items-center justify-between bg-[hsl(var(--primary))]/3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[hsl(var(--primary))]" />
                <h3 className="font-display font-semibold text-[hsl(var(--foreground))] text-sm sm:text-base">Record My Vitals</h3>
              </div>
              <button 
                onClick={() => setVitalsModalOpen(false)}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVitalsSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Systolic BP (mmHg)"
                  placeholder="e.g. 120"
                  type="number"
                  className="text-xs"
                  value={vitalsForm.systolicBp}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, systolicBp: e.target.value }))}
                />
                <Input
                  label="Diastolic BP (mmHg)"
                  placeholder="e.g. 80"
                  type="number"
                  className="text-xs"
                  value={vitalsForm.diastolicBp}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, diastolicBp: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Heart Rate (bpm)"
                  placeholder="e.g. 72"
                  type="number"
                  className="text-xs"
                  value={vitalsForm.heartRate}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, heartRate: e.target.value }))}
                />
                <Input
                  label="Resp Rate (breaths/m)"
                  placeholder="e.g. 16"
                  type="number"
                  className="text-xs"
                  value={vitalsForm.respiratoryRate}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, respiratoryRate: e.target.value }))}
                />
                <Input
                  label="Temperature (°F)"
                  placeholder="e.g. 98.6"
                  type="number"
                  step="0.1"
                  className="text-xs"
                  value={vitalsForm.temperatureF}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, temperatureF: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Weight (lbs)"
                  placeholder="e.g. 165"
                  type="number"
                  step="0.1"
                  className="text-xs"
                  value={vitalsForm.weightLbs}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, weightLbs: e.target.value }))}
                />
                <Input
                  label="Height (in)"
                  placeholder="e.g. 70"
                  type="number"
                  step="0.5"
                  className="text-xs"
                  value={vitalsForm.heightIn}
                  onChange={(e) => setVitalsForm((v) => ({ ...v, heightIn: e.target.value }))}
                />
              </div>

              {vitalsForm.weightLbs && vitalsForm.heightIn && (
                <div className="bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10 rounded-lg px-4 py-2 flex justify-between items-center text-xs">
                  <span className="font-medium text-[hsl(var(--muted-foreground))]">Calculated BMI:</span>
                  <span className="font-bold text-[hsl(var(--primary))]">
                    {calculateBmi(vitalsForm.weightLbs, vitalsForm.heightIn)}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Pain Scale (0-10)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    className="flex-1 accent-[hsl(var(--primary))]"
                    value={vitalsForm.painScale}
                    onChange={(e) => setVitalsForm((v) => ({ ...v, painScale: e.target.value }))}
                  />
                  <span className="text-xs font-bold w-8 text-center text-[hsl(var(--foreground))]">{vitalsForm.painScale}/10</span>
                </div>
              </div>

              <Textarea
                label="Self-reported notes (symptoms, concerns)"
                placeholder="Optional notes to include..."
                className="text-xs"
                rows={2}
                value={vitalsForm.notes}
                onChange={(e) => setVitalsForm((v) => ({ ...v, notes: e.target.value }))}
              />

              {vitalsError && <div className="alert-error text-xs">{vitalsError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setVitalsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={vitalsPending} id="submit-vitals-btn">
                  Log Vitals
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Allergy Modal ────────────────────────────────────────── */}
      {allergiesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-[hsl(var(--border-muted))] flex items-center justify-between bg-[hsl(var(--primary))]/3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[hsl(var(--primary))]" />
                <h3 className="font-display font-semibold text-[hsl(var(--foreground))] text-sm sm:text-base">Report Allergy</h3>
              </div>
              <button 
                onClick={() => setAllergiesModalOpen(false)}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAllergiesSubmit} className="p-6 space-y-4">
              <Input
                label="Allergen *"
                placeholder="e.g. Penicillin, Peanuts"
                required
                className="text-xs"
                value={allergiesForm.allergen}
                onChange={(e) => setAllergiesForm((a) => ({ ...a, allergen: e.target.value }))}
              />

              <Input
                label="Reaction Description"
                placeholder="e.g. hives, swelling, shortness of breath"
                className="text-xs"
                value={allergiesForm.reaction}
                onChange={(e) => setAllergiesForm((a) => ({ ...a, reaction: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Severity *"
                  options={SEVERITY_OPTIONS}
                  className="text-xs"
                  value={allergiesForm.severity}
                  onChange={(e) => setAllergiesForm((a) => ({ ...a, severity: e.target.value as any }))}
                />
                <Input
                  label="Onset Date (optional)"
                  type="date"
                  className="text-xs"
                  value={allergiesForm.onsetDate}
                  onChange={(e) => setAllergiesForm((a) => ({ ...a, onsetDate: e.target.value }))}
                />
              </div>

              {allergiesError && <div className="alert-error text-xs">{allergiesError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setAllergiesModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={allergiesPending} id="submit-allergy-btn">
                  Report Allergy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
