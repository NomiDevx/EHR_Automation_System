'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import type { Profile, UserRole } from '@/lib/types/database';
import { Search, CheckCircle2, XCircle, Edit3, UserPlus, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Physician',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  patient: 'Patient',
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  admin: 'bg-purple-100/80 text-purple-700 border-purple-200',
  doctor: 'bg-blue-100/80 text-blue-700 border-blue-200',
  nurse: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
  receptionist: 'bg-amber-100/80 text-amber-700 border-amber-200',
  patient: 'bg-slate-100 text-slate-700 border-slate-200',
};

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
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in font-sans text-slate-800">
      
      {/* ── TOP BAR: SEARCH & ROLE PILL FILTERS ───────────────────────────── */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="user-search"
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891B2]/30 focus:border-[#0891B2] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Create User Button */}
          <Link
            href="/admin/users/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] text-white font-bold text-xs hover:bg-[#0F766E] transition-all shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Role:
          </span>
          {roles.map((r) => {
            const isSelected = roleFilter === r;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  'px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border',
                  isSelected
                    ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {r === 'all' ? 'All Roles' : ROLE_LABELS[r]}
                {r !== 'all' && (
                  <span className={cn('ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]', isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
                    {users.filter(u => u.role === r).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── USER DATA TABLE ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* User Avatar + Name + Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar firstName={user.first_name} lastName={user.last_name} size="md" role={user.role} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="px-6 py-4">
                    <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold border', ROLE_BADGE_STYLES[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {user.department ?? '—'}
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {formatDate(user.created_at, 'MMM d, yyyy')}
                  </td>

                  {/* Status Indicator */}
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions Button */}
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      id={`edit-user-${user.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0891B2] hover:bg-[#0891B2]/10 hover:border-[#0891B2]/30 transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 text-xs font-semibold">
                    No users matching "{search}" found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
