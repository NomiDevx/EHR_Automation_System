'use client';

import { useState } from 'react';
import { formatDate, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import { Avatar, Badge } from '@/components/ui';
import type { Profile, UserRole } from '@/lib/types/database';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function UserManagementClient({ users }: { users: Profile[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filtered = users.filter((u) => {
    const matchSearch =
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles: (UserRole | 'all')[] = ['all', 'admin', 'doctor', 'nurse', 'receptionist', 'patient'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            id="user-search"
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                roleFilter === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {r === 'all' ? 'All' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pl-5">User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td className="pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" role={user.role} />
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={cn('badge', ROLE_COLORS[user.role])}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="text-[hsl(var(--muted-foreground))] text-xs">{user.department ?? '—'}</td>
                <td className="text-[hsl(var(--muted-foreground))] text-xs">{formatDate(user.created_at)}</td>
                <td>
                  {user.is_active ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <XCircle className="w-3.5 h-3.5" /> Inactive
                    </span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/admin/users/${user.id}`}
                    id={`edit-user-${user.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
