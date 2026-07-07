-- ============================================================
-- EHR System — Migration 002: Row Level Security
-- Run AFTER 001_schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────
alter table profiles        enable row level security;
alter table patients        enable row level security;
alter table care_team       enable row level security;
alter table appointments    enable row level security;
alter table clinical_notes  enable row level security;
alter table vitals          enable row level security;
alter table allergies       enable row level security;
alter table immunizations   enable row level security;
alter table prescriptions   enable row level security;
alter table lab_orders      enable row level security;
alter table lab_results     enable row level security;
alter table invoices        enable row level security;
alter table documents       enable row level security;
alter table consent_forms   enable row level security;
alter table messages        enable row level security;
alter table audit_logs      enable row level security;

-- ─── Helper functions ────────────────────────────────────────

-- Get current user's role
create or replace function current_user_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- Check if current user is staff (admin/doctor/nurse/receptionist)
create or replace function is_staff()
returns boolean language sql stable security definer as $$
  select current_user_role() in ('admin', 'doctor', 'nurse', 'receptionist');
$$;

-- Check if current user is a clinician (admin/doctor/nurse)
create or replace function is_clinician()
returns boolean language sql stable security definer as $$
  select current_user_role() in ('admin', 'doctor', 'nurse');
$$;

-- Check if current user is on a patient's care team
create or replace function is_on_care_team(p_patient_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from care_team
    where patient_id = p_patient_id
      and provider_id = auth.uid()
      and is_active = true
  );
$$;

-- Get the patient_id linked to the current user's profile
create or replace function current_patient_id()
returns uuid language sql stable security definer as $$
  select id from patients where profile_id = auth.uid() limit 1;
$$;

-- Check if current user is the patient owning a row
create or replace function is_own_patient_record(p_patient_id uuid)
returns boolean language sql stable security definer as $$
  select current_patient_id() = p_patient_id;
$$;

-- ─── PROFILES ────────────────────────────────────────────────
-- Users can read their own profile; staff can read all; admin can do everything
create policy "profiles: users read own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: staff read all"
  on profiles for select
  using (is_staff());

create policy "profiles: users update own"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin full access"
  on profiles for all
  using (current_user_role() = 'admin');

-- ─── PATIENTS ────────────────────────────────────────────────
create policy "patients: patient sees own record"
  on patients for select
  using (profile_id = auth.uid());

create policy "patients: care team or admin sees patient"
  on patients for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(id)
      or primary_provider_id = auth.uid()
    )
  );

create policy "patients: receptionist can read all"
  on patients for select
  using (current_user_role() = 'receptionist');

create policy "patients: staff can insert"
  on patients for insert
  with check (is_staff());

create policy "patients: clinician on care team can update"
  on patients for update
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(id)
      or primary_provider_id = auth.uid()
    )
  );

create policy "patients: admin can delete"
  on patients for delete
  using (current_user_role() = 'admin');

-- ─── CARE TEAM ───────────────────────────────────────────────
create policy "care_team: clinicians can read"
  on care_team for select
  using (is_clinician());

create policy "care_team: patient reads own care team"
  on care_team for select
  using (is_own_patient_record(patient_id));

create policy "care_team: admin/doctor can manage"
  on care_team for all
  using (current_user_role() in ('admin', 'doctor'));

-- ─── APPOINTMENTS ────────────────────────────────────────────
create policy "appointments: patient sees own"
  on appointments for select
  using (is_own_patient_record(patient_id));

create policy "appointments: provider sees own"
  on appointments for select
  using (provider_id = auth.uid() and is_staff());

create policy "appointments: care team sees patient's"
  on appointments for select
  using (is_clinician() and is_on_care_team(patient_id));

create policy "appointments: receptionist sees all"
  on appointments for select
  using (current_user_role() = 'receptionist');

create policy "appointments: admin sees all"
  on appointments for select
  using (current_user_role() = 'admin');

create policy "appointments: staff can insert"
  on appointments for insert
  with check (is_staff());

create policy "appointments: staff can update"
  on appointments for update
  using (is_staff());

create policy "appointments: admin can delete"
  on appointments for delete
  using (current_user_role() = 'admin');

-- ─── CLINICAL NOTES ──────────────────────────────────────────
-- Patients can see signed notes only (not drafts)
create policy "clinical_notes: patient sees own signed notes"
  on clinical_notes for select
  using (
    is_own_patient_record(patient_id)
    and status = 'signed'
  );

create policy "clinical_notes: clinician on care team sees all"
  on clinical_notes for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or provider_id = auth.uid()
      or is_on_care_team(patient_id)
    )
  );

create policy "clinical_notes: clinician on care team can insert"
  on clinical_notes for insert
  with check (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

-- Can only update DRAFT notes (signed notes are locked)
create policy "clinical_notes: author can update draft"
  on clinical_notes for update
  using (
    provider_id = auth.uid()
    and status = 'draft'
    and is_clinician()
  );

-- Admin can update (for addenda on signed notes — application enforces addenda-only)
create policy "clinical_notes: admin update"
  on clinical_notes for update
  using (current_user_role() = 'admin');

create policy "clinical_notes: admin delete"
  on clinical_notes for delete
  using (current_user_role() = 'admin');

-- ─── VITALS ──────────────────────────────────────────────────
create policy "vitals: patient sees own"
  on vitals for select
  using (is_own_patient_record(patient_id));

create policy "vitals: clinician on care team sees"
  on vitals for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or recorded_by = auth.uid()
      or is_on_care_team(patient_id)
    )
  );

create policy "vitals: nurse/doctor on care team inserts"
  on vitals for insert
  with check (
    current_user_role() in ('admin', 'doctor', 'nurse')
    and (current_user_role() = 'admin' or is_on_care_team(patient_id))
  );

create policy "vitals: admin delete"
  on vitals for delete
  using (current_user_role() = 'admin');

-- ─── ALLERGIES ───────────────────────────────────────────────
create policy "allergies: patient sees own"
  on allergies for select
  using (is_own_patient_record(patient_id));

create policy "allergies: clinician on care team"
  on allergies for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

create policy "allergies: clinician on care team inserts"
  on allergies for insert
  with check (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

create policy "allergies: clinician on care team updates"
  on allergies for update
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

-- ─── IMMUNIZATIONS ───────────────────────────────────────────
create policy "immunizations: patient sees own"
  on immunizations for select
  using (is_own_patient_record(patient_id));

create policy "immunizations: clinician on care team"
  on immunizations for all
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

-- ─── PRESCRIPTIONS ───────────────────────────────────────────
create policy "prescriptions: patient sees own active"
  on prescriptions for select
  using (is_own_patient_record(patient_id));

create policy "prescriptions: clinician on care team"
  on prescriptions for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or prescriber_id = auth.uid()
      or is_on_care_team(patient_id)
    )
  );

create policy "prescriptions: doctor/admin can insert"
  on prescriptions for insert
  with check (
    current_user_role() in ('admin', 'doctor')
    and (current_user_role() = 'admin' or is_on_care_team(patient_id))
  );

create policy "prescriptions: doctor/admin can update"
  on prescriptions for update
  using (
    current_user_role() in ('admin', 'doctor')
    and (current_user_role() = 'admin' or prescriber_id = auth.uid() or is_on_care_team(patient_id))
  );

-- ─── LAB ORDERS ──────────────────────────────────────────────
create policy "lab_orders: patient sees own"
  on lab_orders for select
  using (is_own_patient_record(patient_id));

create policy "lab_orders: clinician on care team"
  on lab_orders for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or ordering_provider_id = auth.uid()
      or is_on_care_team(patient_id)
    )
  );

create policy "lab_orders: doctor/admin inserts"
  on lab_orders for insert
  with check (
    current_user_role() in ('admin', 'doctor')
    and (current_user_role() = 'admin' or is_on_care_team(patient_id))
  );

create policy "lab_orders: clinician updates"
  on lab_orders for update
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

-- ─── LAB RESULTS ─────────────────────────────────────────────
create policy "lab_results: patient sees own"
  on lab_results for select
  using (is_own_patient_record(patient_id));

create policy "lab_results: clinician on care team"
  on lab_results for select
  using (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

create policy "lab_results: clinician inserts results"
  on lab_results for insert
  with check (
    is_clinician() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
    )
  );

create policy "lab_results: admin delete"
  on lab_results for delete
  using (current_user_role() = 'admin');

-- ─── INVOICES ────────────────────────────────────────────────
create policy "invoices: patient sees own"
  on invoices for select
  using (is_own_patient_record(patient_id));

create policy "invoices: receptionist/admin sees all"
  on invoices for select
  using (current_user_role() in ('admin', 'receptionist'));

create policy "invoices: receptionist/admin manages"
  on invoices for all
  using (current_user_role() in ('admin', 'receptionist'));

-- ─── DOCUMENTS ───────────────────────────────────────────────
create policy "documents: patient sees own"
  on documents for select
  using (is_own_patient_record(patient_id));

create policy "documents: staff on care team sees"
  on documents for select
  using (
    is_staff() and (
      current_user_role() = 'admin'
      or is_on_care_team(patient_id)
      or current_user_role() = 'receptionist'
    )
  );

create policy "documents: staff uploads"
  on documents for insert
  with check (is_staff());

create policy "documents: admin deletes"
  on documents for delete
  using (current_user_role() = 'admin');

-- ─── CONSENT FORMS ───────────────────────────────────────────
create policy "consent_forms: patient sees own"
  on consent_forms for select
  using (is_own_patient_record(patient_id));

create policy "consent_forms: staff sees"
  on consent_forms for select
  using (is_staff());

create policy "consent_forms: staff manages"
  on consent_forms for all
  using (is_staff());

-- ─── MESSAGES ────────────────────────────────────────────────
create policy "messages: participants can read"
  on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "messages: authenticated users can send"
  on messages for insert
  with check (sender_id = auth.uid());

create policy "messages: recipients can update (mark read)"
  on messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ─── AUDIT LOGS ──────────────────────────────────────────────
-- Only admins can read audit logs; anyone (server-side) can insert
create policy "audit_logs: admin reads"
  on audit_logs for select
  using (current_user_role() = 'admin');

create policy "audit_logs: service role inserts"
  on audit_logs for insert
  with check (true);  -- actual restriction enforced at app layer with service role key

-- ─── Storage bucket RLS hint ─────────────────────────────────
-- Create buckets in Supabase Dashboard: Storage → New Bucket
-- Bucket name: "documents" — set to PRIVATE
-- Bucket name: "avatars"   — set to PRIVATE
-- Use signed URLs (createSignedUrl) everywhere — never public URLs for PHI
-- Example policy snippet for the documents bucket (run in Storage Policies):
--   allow select for: bucket_id = 'documents' AND auth.uid() IS NOT NULL
--   (actual file-level auth enforced in application via RLS + signed URL expiry)
