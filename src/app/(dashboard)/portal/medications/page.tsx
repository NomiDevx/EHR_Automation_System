import type { Metadata } from 'next';
import type { PrescriptionStatus } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate, PRESCRIPTION_STATUS_COLORS } from '@/lib/utils';
import { Pill, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';

export const metadata: Metadata = { title: 'My Medications' };

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
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">My Medications</h1>

      {active.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Active Prescriptions</h2>
          <div className="space-y-3">
            {active.map((rx: any) => (
              <div key={rx.id} className="card flex items-start gap-4">
                <div className="rounded-xl p-2.5 bg-amber-500/10 border border-amber-500/20 shrink-0">
                  <Pill className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {rx.drug_name}
                        {rx.drug_generic_name && <span className="font-normal text-[hsl(var(--muted-foreground))]"> ({rx.drug_generic_name})</span>}
                      </p>
                      <p className="text-sm text-[hsl(var(--foreground))] mt-0.5">
                        {rx.dosage} · {rx.frequency} · {rx.route ?? 'oral'}
                      </p>
                    </div>
                    {rx.interaction_flagged && (
                      <span className="badge bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                        <AlertTriangle className="w-2.5 h-2.5" /> See prescriber
                      </span>
                    )}
                  </div>
                  {rx.instructions && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 italic">{rx.instructions}</p>
                  )}
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Prescribed by Dr. {(rx.prescriber as any)?.last_name} · Started {formatDate(rx.start_date)}
                    {rx.refills_remaining > 0 && ` · ${rx.refills_remaining} refill(s) remaining`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Inactive / Past</h2>
          <div className="space-y-2">
            {inactive.map((rx: any) => (
              <div key={rx.id} className="flex items-center gap-4 py-2 border-b border-[hsl(var(--border-muted))] last:border-0 opacity-60">
                <Pill className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <div className="flex-1">
                  <p className="text-sm">{rx.drug_name} · {rx.dosage}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(rx.start_date)} – {rx.end_date ? formatDate(rx.end_date) : 'discontinued'}</p>
                </div>
                <span className={cn('badge text-xs', PRESCRIPTION_STATUS_COLORS[rx.status as PrescriptionStatus])}>{rx.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!prescriptions?.length && (
        <div className="text-center py-16">
          <Pill className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No medications on record</p>
        </div>
      )}
    </div>
  );
}
