import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AuditLogClient } from './client';

export const metadata: Metadata = { title: 'Audit Logs | Admin' };

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles(first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Audit Logs</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Access and compliance event log — last 200 events
        </p>
      </div>
      <AuditLogClient logs={logs ?? []} />
    </div>
  );
}
