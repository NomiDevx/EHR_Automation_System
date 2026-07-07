import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate, LAB_FLAG_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Lab Results' };

export default async function PortalLabsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
  if (!patient) redirect('/portal');

  const { data: labOrders } = await supabase
    .from('lab_orders')
    .select('*, results:lab_results(*), ordering_provider:profiles(first_name, last_name)')
    .eq('patient_id', patient.id)
    .eq('status', 'resulted')
    .order('ordered_at', { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Lab Results</h1>

      {labOrders?.map((order: any) => (
        <Card key={order.id}>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{order.test_name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Ordered {formatDate(order.ordered_at)} · Dr. {(order.ordering_provider as any)?.last_name}
              </p>
            </div>
          </div>
          <table className="data-table">
            <thead><tr><th>Test</th><th>Result</th><th>Reference Range</th><th>Status</th></tr></thead>
            <tbody>
              {(order.results as any[]).map((r: any) => (
                <tr key={r.id}>
                  <td className="text-sm font-medium">{r.component_name}</td>
                  <td className={cn('font-mono font-semibold text-sm', LAB_FLAG_COLORS[r.flag as keyof typeof LAB_FLAG_COLORS])}>
                    {r.value} {r.unit}
                  </td>
                  <td className="text-xs text-[hsl(var(--muted-foreground))]">{r.reference_low} – {r.reference_high} {r.unit}</td>
                  <td>
                    <span className={cn('badge text-xs', r.flag === 'normal' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')}>
                      {r.flag === 'normal' ? 'Normal' : r.flag.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      {!labOrders?.length && (
        <div className="text-center py-16">
          <FlaskConical className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No lab results available</p>
        </div>
      )}
    </div>
  );
}
