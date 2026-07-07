-- ============================================================
-- EHR System — Migration 005: Fix Trigger Type Mismatches
-- Run this in the Supabase SQL Editor if signups are returning 500
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')::user_role
  );
  return new;
end;
$$;
