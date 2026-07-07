import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDate, formatRelative, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import { UserPlus, Search } from 'lucide-react';
import { Card, Badge, Avatar } from '@/components/ui';
import type { Profile, UserRole } from '@/lib/types/database';
import { UserManagementClient } from './client';

export const metadata: Metadata = { title: 'User Management | Admin' };

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">User Management</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{users?.length ?? 0} total accounts</p>
        </div>
        <Link href="/admin/users/new" id="create-user-btn" className="btn-primary btn">
          <UserPlus className="w-4 h-4" />
          Add User
        </Link>
      </div>

      <UserManagementClient users={users ?? []} />
    </div>
  );
}
