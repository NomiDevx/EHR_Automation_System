import type { Metadata } from 'next';
import type { PrescriptionStatus } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate, PRESCRIPTION_STATUS_COLORS } from '@/lib/utils';
import { Pill, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';

export const metadata: Metadata = { title: 'My Medications | MediSynx EHR' };

export default async function PortalMedicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
  if (!patient) {
    return (
      <PortalOnboardingWarning 
        title="Medications List Inactive" 
        description="To view your active prescriptions, dosages, and refill statuses, you must first complete your onboarding consultation."
      />
    );
  }

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*, prescriber:profiles(first_name, last_name)')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  const active = prescriptions?.filter((r: any) => r.status === 'active') ?? [];
  const inactive = prescriptions?.filter((r: any) => r.status !== 'active') ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20">
            <Sparkles className="w-3.5 h-3.5" /> Rx Prescriptions
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">My Medications</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            {active.length} active prescriptions · {inactive.length} past
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
          <Pill className="w-6 h-6" />
        </div>
      </div>

      {active.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-cambria text-xl font-bold text-[#0B2A55]">Active Prescriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.map((rx: any) => (
              <div key={rx.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4 hover:border-[#14B8A6] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-cambria font-bold text-base text-[#0B2A55]">
                        {rx.drug_name}
                      </p>
                      {rx.drug_generic_name && (
                        <p className="text-xs text-[#94A3B8]">({rx.drug_generic_name})</p>
                      )}
                    </div>
                  </div>
                  {rx.interaction_flagged && (
                    <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] space-y-1 text-xs text-[#0F172A]">
                  <p className="font-bold">{rx.dosage} · {rx.frequency}</p>
                  {rx.instructions && (
                    <p className="text-[#475569] italic">{rx.instructions}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#475569]">
                  <span>Dr. {(rx.prescriber as any)?.first_name} {(rx.prescriber as any)?.last_name}</span>
                  <span className="font-semibold text-[#14B8A6]">{rx.refills_remaining ?? 0} Refill(s) Left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">Past / Discontinued Medications</h2>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-3">
            {inactive.map((rx: any) => (
              <div key={rx.id} className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0 opacity-75 text-xs">
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-[#94A3B8]" />
                  <div>
                    <p className="font-bold text-[#0B2A55]">{rx.drug_name} ({rx.dosage})</p>
                    <p className="text-[#94A3B8] text-[11px]">Started {formatDate(rx.start_date)}</p>
                  </div>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border', PRESCRIPTION_STATUS_COLORS[rx.status as PrescriptionStatus])}>
                  {rx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!prescriptions?.length && (
        <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-3xl space-y-3">
          <Pill className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">No Active Prescriptions</h3>
          <p className="text-xs text-[#475569]">Your prescribed medications and refills will automatically appear here.</p>
        </div>
      )}
    </div>
  );
}
