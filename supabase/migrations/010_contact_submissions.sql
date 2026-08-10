-- ============================================================
-- EHR System — Migration 010: Contact Submissions Table
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- ============================================================

create table if not exists contact_submissions (
  id          text primary key,
  name        text not null,
  email       text not null,
  subject     text not null,
  message     text not null,
  status      text not null default 'unread' check (status in ('unread', 'read', 'replied')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_contact_submissions_status     on contact_submissions(status);
create index if not exists idx_contact_submissions_created_at on contact_submissions(created_at desc);

-- Enable RLS
alter table contact_submissions enable row level security;

-- Drop existing policies if any
drop policy if exists "contact_submissions: service role & admin full access" on contact_submissions;
drop policy if exists "contact_submissions: public insert" on contact_submissions;

-- Policies
create policy "contact_submissions: service role & admin full access"
  on contact_submissions for all
  using (true)
  with check (true);

create policy "contact_submissions: public insert"
  on contact_submissions for insert
  with check (true);

-- Seed sample data if table is currently empty
insert into contact_submissions (id, name, email, subject, message, status, created_at)
select 'cnt-101', 'Sarah Jenkins', 'sarah.j@example.com', 'Appointment Rescheduling & Patient Portal Access', 'Hello, I submitted an appointment request for next Tuesday but need to shift it to Wednesday afternoon if possible. Also, how do I link my account to the patient portal? Thanks!', 'unread', now() - interval '30 minutes'
where not exists (select 1 from contact_submissions where id = 'cnt-101');

insert into contact_submissions (id, name, email, subject, message, status, created_at)
select 'cnt-102', 'Dr. Robert Chen', 'rchen@cityclinic.org', 'Clinical EHR Integration & Billing Query', 'We operate an outpatient clinic in NY with 12 physicians. Can your system migrate patient records from Epic/Cerner via FHIR R4 interfaces? Please have sales/admin contact me.', 'read', now() - interval '5 hours'
where not exists (select 1 from contact_submissions where id = 'cnt-102');
