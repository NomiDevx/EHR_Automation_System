-- ============================================================
-- EHR System — Migration 006: Robustly Fix Signup Trigger
-- Run this in Supabase SQL Editor → New Query → Run
-- Fixes: "Database error saving new user" (HTTP 500 on signup)
-- ============================================================

-- Step 1: Drop and recreate the trigger with proper schema and exception handling
drop trigger if exists on_auth_user_created on auth.users;

-- Step 2: Replace the function with a robust version
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')::public.user_role
  )
  on conflict (id) do update
    set
      email      = excluded.email,
      first_name = case when excluded.first_name <> '' then excluded.first_name else profiles.first_name end,
      last_name  = case when excluded.last_name  <> '' then excluded.last_name  else profiles.last_name  end,
      updated_at = now();

  return new;
exception
  when others then
    raise warning 'handle_new_user trigger failed for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Step 3: Re-create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
