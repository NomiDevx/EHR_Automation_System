'use client';

import { useState } from 'react';
import { formatDate, formatCents, BILLING_STATUS_COLORS, humanizeLabel } from '@/lib/utils';
import type { Invoice, BillingStatus } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function BillingClient({ invoices }: { invoices: (Invoice & { patient: any })[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillingStatus | 'all'>('all');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const filtered = invoices.filter((inv) => {
    const pt = inv.patient;
    const matchSearch = [inv.invoice_number, pt?.first_name, pt?.last_name, pt?.mrn, inv.insurance_provider ?? '']
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    total: invoices.reduce((s, i) => s + i.total_cents, 0),
    paid: invoices.reduce((s, i) => s + i.paid_cents, 0),
    outstanding: invoices.reduce((s, i) => s + (i.total_cents - i.paid_cents), 0),
  };

  const markPaid = async (invoiceId: string) => {
    setMarkingPaid(invoiceId);
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId);
    router.refresh();
    setMarkingPaid(null);
  };

  const statuses: (BillingStatus | 'all')[] = ['all', 'draft', 'submitted', 'paid', 'partially_paid', 'denied', 'void'];

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card"><p className="stat-value">{formatCents(totals.total)}</p><p className="stat-label">Total Billed</p></div>
        <div className="card"><p className="stat-value text-emerald-400">{formatCents(totals.paid)}</p><p className="stat-label">Collected</p></div>
        <div className="card"><p className="stat-value text-amber-400">{formatCents(totals.outstanding)}</p><p className="stat-label">Outstanding</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input id="billing-search" type="search" placeholder="Search invoice, patient, MRN…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]')}>
              {s === 'all' ? 'All' : humanizeLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pl-5">Invoice #</th>
              <th>Patient</th>
              <th>Issued</th>
              <th>Total</th>
              <th>Insurance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td className="pl-5 font-mono text-xs">{inv.invoice_number}</td>
                <td>
                  <div>
                    <p className="text-sm font-medium">{inv.patient?.first_name} {inv.patient?.last_name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{inv.patient?.mrn}</p>
                  </div>
                </td>
                <td className="text-xs">{formatDate(inv.issued_at)}</td>
                <td className="font-mono text-sm">{formatCents(inv.total_cents)}</td>
                <td className="text-xs text-[hsl(var(--muted-foreground))]">{inv.insurance_provider ?? '—'}</td>
                <td>
                  <span className={cn('badge text-xs', BILLING_STATUS_COLORS[inv.status])}>{inv.status}</span>
                </td>
                <td>
                  {!['paid', 'void'].includes(inv.status) && (
                    <button
                      id={`mark-paid-${inv.id}`}
                      onClick={() => markPaid(inv.id)}
                      disabled={markingPaid === inv.id}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {markingPaid === inv.id ? 'Saving…' : 'Mark Paid'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
