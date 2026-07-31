-- ============================================================
-- EHR System — Migration 004: System Settings
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists system_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table system_settings enable row level security;

-- Policies:
-- Only authenticated admin profiles can read/write settings
create policy "Admins can do everything on system_settings"
  on system_settings
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Insert default configurations
insert into system_settings (key, value)
values ('webhook_url', 'https://simadi6690.app.n8n.cloud/webhook-test/book-appointment')
on conflict (key) do nothing;
