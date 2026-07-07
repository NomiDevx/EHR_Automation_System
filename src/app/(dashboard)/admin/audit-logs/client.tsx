'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog, AuditAction } from '@/lib/types/database';
import { Search, Shield, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'text-emerald-400 bg-emerald-500/10',
  read: 'text-blue-400 bg-blue-500/10',
  update: 'text-amber-400 bg-amber-500/10',
  delete: 'text-red-400 bg-red-500/10',
  login: 'text-slate-400 bg-slate-500/10',
  logout: 'text-slate-400 bg-slate-500/10',
  export: 'text-orange-400 bg-orange-500/10',
  sign: 'text-purple-400 bg-purple-500/10',
};

const SENSITIVE_ACTIONS: AuditAction[] = ['delete', 'export'];

export function AuditLogClient({ logs }: { logs: (AuditLog & { actor: any })[] }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  const filtered = logs.filter((log) => {
    const actorName = log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : '';
    const matchSearch = [actorName, log.table_name, log.action, log.record_id ?? '']
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const actions: (AuditAction | 'all')[] = ['all', 'create', 'read', 'update', 'delete', 'login', 'export', 'sign'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            id="audit-search"
            type="search"
            placeholder="Search actor, table, action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                actionFilter === a
                  ? 'bg-blue-600 text-white'
                  : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pl-5">Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className={SENSITIVE_ACTIONS.includes(log.action) ? 'bg-red-500/5' : ''}>
                <td className="pl-5 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </td>
                <td className="text-xs">
                  {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : 'System'}
                </td>
                <td>
                  <span className={cn('badge text-xs', ACTION_COLORS[log.action])}>
                    {log.action}
                  </span>
                </td>
                <td className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{log.table_name}</td>
                <td className="text-xs font-mono text-[hsl(var(--muted-foreground))] max-w-[120px] truncate">
                  {log.record_id ?? '—'}
                </td>
                <td className="text-xs text-[hsl(var(--muted-foreground))]">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No audit events found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
