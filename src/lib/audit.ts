'use client';

import { createClient } from '@/lib/supabase/client';
import type { AuditAction } from '@/lib/types/database';

interface LogEvent {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  patientId?: string;
  changes?: Record<string, unknown>;
}

/**
 * Log an audit event from the client side.
 * PHI values should never be included in `changes` — only field names and non-PHI metadata.
 */
export async function logAudit(event: LogEvent) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: event.action,
    table_name: event.tableName,
    record_id: event.recordId,
    patient_id: event.patientId,
    changes: event.changes,
  });
}
