import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BillingClient } from './client';

export const metadata: Metadata = { title: 'Billing' };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, patient:patients(first_name, last_name, mrn)')
    .order('issued_at', { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Billing & Invoices</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{invoices?.length ?? 0} total invoices</p>
      </div>
      <BillingClient invoices={invoices ?? []} />
    </div>
  );
}
