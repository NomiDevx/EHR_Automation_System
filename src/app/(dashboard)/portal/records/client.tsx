'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPatientVital, addPatientAllergy } from '@/app/actions';
import { Activity, ShieldAlert, Plus, X, Heart, Scale, Thermometer, AlertOctagon, Calendar, Sparkles } from 'lucide-react';
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
  mild: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  moderate: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  severe: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  life_threatening: 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse font-bold',
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

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] p-2 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('vitals')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 ${
            activeTab === 'vitals'
              ? 'bg-[#0891B2] text-white shadow-md'
              : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
          }`}
        >
          <Activity className="w-4 h-4" /> <span className="xs:hidden">Vitals</span><span className="hidden xs:inline">Vitals &amp; Measurements</span>
        </button>
        <button
          onClick={() => setActiveTab('allergies')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 ${
            activeTab === 'allergies'
              ? 'bg-[#0891B2] text-white shadow-md'
              : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Allergies
        </button>
      </div>

      {/* Tab 1: Vitals History */}
      {activeTab === 'vitals' && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F1F5F9] pb-4 gap-4">
            <div>
              <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Logged Vitals History</h2>
              <p className="text-xs text-[#475569]">Track your blood pressure, temperature, weight, and general measurements.</p>
            </div>
            <button
              onClick={() => setVitalsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-sm inline-flex items-center gap-2 shrink-0"
              id="log-vitals-btn"
            >
              <Plus className="w-4 h-4" /> + Log Vitals
            </button>
          </div>

          {initialVitals.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Activity className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
              <p className="text-xs text-[#475569]">No vitals on record yet. Log your first measurement above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] -mx-2 px-2">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0B2A55] text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-4 whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-4 whitespace-nowrap">Blood Pressure</th>
                    <th className="px-4 py-4 whitespace-nowrap">Heart Rate</th>
                    <th className="px-4 py-4">Temp</th>
                    <th className="px-4 py-4">Weight</th>
                    <th className="px-4 py-4">Height</th>
                    <th className="px-4 py-4">BMI</th>
                    <th className="px-4 py-4">Pain</th>
                    <th className="px-4 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {initialVitals.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-4 font-bold text-[#0F172A] whitespace-nowrap">
                        {formatDate(v.recorded_at, 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono font-semibold text-[#0891B2]">
                        {v.systolic_bp && v.diastolic_bp ? `${v.systolic_bp}/${v.diastolic_bp} mmHg` : '—'}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#0F172A]">
                        {v.heart_rate ? `${v.heart_rate} bpm` : '—'}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#0F172A]">
                        {v.temperature_f ? `${v.temperature_f} °F` : '—'}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#0F172A]">
                        {v.weight_lbs ? `${v.weight_lbs} lbs` : '—'}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#0F172A]">
                        {v.height_in ? `${v.height_in} in` : '—'}
                      </td>
                      <td className="px-4 py-4 font-bold text-[#0891B2]">
                        {v.bmi ? v.bmi : '—'}
                      </td>
                      <td className="px-4 py-4">
                        {v.pain_scale !== null ? (
                          <span className={cn(
                            'px-2 py-1 rounded-full text-[11px] font-bold uppercase border',
                            v.pain_scale >= 7 ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                            v.pain_scale >= 4 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          )}>
                            {v.pain_scale}/10
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 max-w-[120px] truncate text-[#475569]" title={v.notes}>
                        {v.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Allergies */}
      {activeTab === 'allergies' && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F1F5F9] pb-4 gap-4">
            <div>
              <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Active Allergies</h2>
              <p className="text-xs text-[#475569]">View and report allergies and sensitivities to inform clinical staff.</p>
            </div>
            <button
              onClick={() => setAllergiesModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-sm inline-flex items-center gap-2 shrink-0"
              id="add-allergy-btn"
            >
              <Plus className="w-4 h-4" /> + Report Allergy
            </button>
          </div>

          {initialAllergies.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShieldAlert className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
              <p className="text-xs text-[#475569]">No allergies reported. Report any allergy or reaction above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0B2A55] text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-4">Allergen</th>
                    <th className="px-5 py-4">Severity</th>
                    <th className="px-5 py-4">Reaction</th>
                    <th className="px-5 py-4">Onset Date</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {initialAllergies.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-4 font-bold text-[#0B2A55]">{a.allergen}</td>
                      <td className="px-5 py-4">
                        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border', SEVERITY_BADGES[a.severity as keyof typeof SEVERITY_BADGES])}>
                          {a.severity.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#475569]">{a.reaction || '—'}</td>
                      <td className="px-5 py-4 text-[#475569]">{a.onset_date ? formatDate(a.onset_date, 'MMMM d, yyyy') : '—'}</td>
                      <td className="px-5 py-4">
                        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border', a.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-500/20')}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Log Vitals Modal */}
      {vitalsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0891B2]" />
                <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">Record My Vitals</h3>
              </div>
              <button onClick={() => setVitalsModalOpen(false)} className="p-1 rounded-xl text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVitalsSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F172A]">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={vitalsForm.systolicBp}
                    onChange={(e) => setVitalsForm(f => ({ ...f, systolicBp: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A]">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitalsForm.diastolicBp}
                    onChange={(e) => setVitalsForm(f => ({ ...f, diastolicBp: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F172A]">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm(f => ({ ...f, heartRate: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A]">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={vitalsForm.temperatureF}
                    onChange={(e) => setVitalsForm(f => ({ ...f, temperatureF: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F172A]">Weight (lbs)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={vitalsForm.weightLbs}
                    onChange={(e) => setVitalsForm(f => ({ ...f, weightLbs: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A]">Height (inches)</label>
                  <input
                    type="number"
                    placeholder="68"
                    value={vitalsForm.heightIn}
                    onChange={(e) => setVitalsForm(f => ({ ...f, heightIn: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A]">Notes / Context</label>
                <textarea
                  rows={2}
                  placeholder="Taken after morning workout..."
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>

              {vitalsError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold">
                  {vitalsError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setVitalsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vitalsPending}
                  className="px-6 py-2 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-sm disabled:opacity-50"
                >
                  {vitalsPending ? 'Saving…' : 'Save Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Allergy Modal */}
      {allergiesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#0891B2]" />
                <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">Report Allergy</h3>
              </div>
              <button onClick={() => setAllergiesModalOpen(false)} className="p-1 rounded-xl text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllergiesSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A]">Allergen Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts"
                  required
                  value={allergiesForm.allergen}
                  onChange={(e) => setAllergiesForm(f => ({ ...f, allergen: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A]">Severity *</label>
                <select
                  value={allergiesForm.severity}
                  onChange={(e) => setAllergiesForm(f => ({ ...f, severity: e.target.value as any }))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A]">Reaction Description</label>
                <input
                  type="text"
                  placeholder="e.g. Hives, difficulty breathing"
                  value={allergiesForm.reaction}
                  onChange={(e) => setAllergiesForm(f => ({ ...f, reaction: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>

              {allergiesError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold">
                  {allergiesError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setAllergiesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allergiesPending}
                  className="px-6 py-2 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-sm disabled:opacity-50"
                >
                  {allergiesPending ? 'Saving…' : 'Report Allergy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
