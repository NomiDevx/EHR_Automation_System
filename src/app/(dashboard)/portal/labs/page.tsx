import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate, LAB_FLAG_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FlaskConical, Sparkles } from 'lucide-react';
import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';

export const metadata: Metadata = { title: 'Lab Results | MediSynx EHR' };

export default async function PortalLabsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
  if (!patient) {
    return (
      <PortalOnboardingWarning 
        title="Laboratory Results Locked" 
        description="To view your lab orders and diagnostic results, you must first complete your onboarding consultation."
      />
    );
  }

  const { data: labOrders } = await supabase
    .from('lab_orders')
    .select('*, results:lab_results(*), ordering_provider:profiles(first_name, last_name)')
    .eq('patient_id', patient.id)
    .eq('status', 'resulted')
    .order('ordered_at', { ascending: false });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20">
            <Sparkles className="w-3.5 h-3.5" /> Diagnostic History
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">Lab Results & Diagnostics</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            {labOrders?.length ?? 0} lab orders resulted
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50] shrink-0">
          <FlaskConical className="w-6 h-6" />
        </div>
      </div>

      {labOrders?.map((order: any) => (
        <div key={order.id} className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 border-b border-[#F1F5F9] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cambria text-lg font-bold text-[#0B2A55]">{order.test_name}</h2>
              <p className="text-xs text-[#475569]">
                Ordered {formatDate(order.ordered_at)} · Dr. {(order.ordering_provider as any)?.first_name} {(order.ordering_provider as any)?.last_name}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#94A3B8] font-bold uppercase tracking-wider">
                  <th className="pb-3">Test Component</th>
                  <th className="pb-3">Result Value</th>
                  <th className="pb-3">Reference Range</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {(order.results as any[]).map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3.5 font-bold text-[#0F172A]">{r.component_name}</td>
                    <td className={cn('py-3.5 font-mono font-bold text-sm', LAB_FLAG_COLORS[r.flag as keyof typeof LAB_FLAG_COLORS])}>
                      {r.value} {r.unit}
                    </td>
                    <td className="py-3.5 text-[#475569]">{r.reference_low} – {r.reference_high} {r.unit}</td>
                    <td className="py-3.5">
                      <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase', r.flag === 'normal' ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>
                        {r.flag === 'normal' ? 'Normal' : r.flag.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!labOrders?.length && (
        <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-3xl space-y-3">
          <FlaskConical className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">No Lab Results Yet</h3>
          <p className="text-xs text-[#475569]">Your lab diagnostic reports will automatically appear here once resulted by clinicians.</p>
        </div>
      )}
    </div>
  );
}
