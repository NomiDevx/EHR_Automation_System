-- ============================================================
-- EHR System — Migration 008: Store webhook_url on appointments
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add webhook_url column to appointments
alter table appointments add column if not exists webhook_url text;

-- 2. Create function to fetch current active webhook_url and set it on insert
create or replace function set_appointment_webhook_url()
returns trigger as $$
begin
  new.webhook_url := (select value from system_settings where key = 'webhook_url' limit 1);
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create trigger to set the webhook_url before inserting a row
drop trigger if exists trg_set_appointment_webhook_url on appointments;
create trigger trg_set_appointment_webhook_url
before insert on appointments
for each row
execute function set_appointment_webhook_url();
