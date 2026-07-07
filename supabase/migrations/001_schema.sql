-- ============================================================
-- EHR System — Migration 001: Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────
create type user_role as enum ('admin', 'doctor', 'nurse', 'receptionist', 'patient');
create type appointment_status as enum ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type appointment_type as enum ('new_patient', 'follow_up', 'urgent', 'telehealth', 'procedure', 'wellness');
create type prescription_status as enum ('active', 'discontinued', 'completed', 'on_hold');
create type lab_order_status as enum ('ordered', 'collected', 'in_progress', 'resulted', 'cancelled');
create type lab_result_flag as enum ('normal', 'low', 'high', 'critical_low', 'critical_high');
create type billing_status as enum ('draft', 'submitted', 'paid', 'partially_paid', 'denied', 'void');
create type note_status as enum ('draft', 'signed', 'amended');
create type allergy_severity as enum ('mild', 'moderate', 'severe', 'life_threatening');
create type gender as enum ('male', 'female', 'non_binary', 'other', 'prefer_not_to_say');
create type document_type as enum ('consent_form', 'referral', 'lab_attachment', 'imaging', 'insurance_card', 'id_document', 'other');
create type message_status as enum ('sent', 'delivered', 'read');
create type audit_action as enum ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'sign');

-- ─── Profiles (extends auth.users) ──────────────────────────
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           user_role not null default 'patient',
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  phone          text,
  npi_number     text,           -- for providers (National Provider Identifier)
  specialty      text,           -- for doctors
  department     text,
  avatar_url     text,
  is_active      boolean not null default true,
  mfa_enabled    boolean not null default false,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── Patients ────────────────────────────────────────────────
create table patients (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid references profiles(id) on delete set null,  -- null if no portal account
  mrn                   text unique not null,    -- Medical Record Number
  first_name            text not null,
  last_name             text not null,
  date_of_birth         date not null,
  gender                gender not null,
  ssn_encrypted         text,                   -- store encrypted, never plaintext
  email                 text,
  phone                 text,
  address_line1         text,
  address_line2         text,
  city                  text,
  state                 text,
  zip_code              text,
  country               text default 'US',
  -- Emergency contact
  emergency_name        text,
  emergency_relationship text,
  emergency_phone       text,
  -- Insurance
  insurance_provider    text,
  insurance_policy_num  text,
  insurance_group_num   text,
  insurance_holder_name text,
  insurance_holder_dob  date,
  -- Status
  is_active             boolean not null default true,
  consent_obtained      boolean not null default false,
  consent_date          timestamptz,
  primary_provider_id   uuid references profiles(id) on delete set null,
  created_by            uuid references profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-generate MRN
create sequence mrn_seq start 100001;
alter table patients alter column mrn set default 'MRN-' || lpad(nextval('mrn_seq')::text, 6, '0');

-- ─── Care Team ───────────────────────────────────────────────
create table care_team (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references patients(id) on delete cascade,
  provider_id uuid not null references profiles(id) on delete cascade,
  role        text not null,   -- 'primary', 'attending', 'consulting', 'nursing'
  added_by    uuid references profiles(id) on delete set null,
  added_at    timestamptz not null default now(),
  is_active   boolean not null default true,
  unique(patient_id, provider_id)
);

-- ─── Appointments ────────────────────────────────────────────
create table appointments (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  provider_id     uuid not null references profiles(id) on delete cascade,
  location_id     uuid,                          -- future: locations table
  type            appointment_type not null default 'follow_up',
  status          appointment_status not null default 'scheduled',
  scheduled_at    timestamptz not null,
  duration_mins   integer not null default 30,
  chief_complaint text,
  notes           text,
  reminder_sent   boolean not null default false,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Clinical Notes (SOAP) ───────────────────────────────────
create table clinical_notes (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  provider_id     uuid not null references profiles(id) on delete cascade,
  appointment_id  uuid references appointments(id) on delete set null,
  status          note_status not null default 'draft',
  -- SOAP sections
  subjective      text,    -- Patient-reported symptoms
  objective       text,    -- Exam findings, vitals, test results
  assessment      text,    -- Diagnosis / differential
  plan            text,    -- Treatment plan
  -- Addenda (after signing)
  addenda         jsonb not null default '[]',  -- [{author_id, text, created_at}]
  signed_at       timestamptz,
  signed_by       uuid references profiles(id) on delete set null,
  version         integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Vitals ──────────────────────────────────────────────────
create table vitals (
  id                uuid primary key default uuid_generate_v4(),
  patient_id        uuid not null references patients(id) on delete cascade,
  recorded_by       uuid not null references profiles(id) on delete cascade,
  appointment_id    uuid references appointments(id) on delete set null,
  recorded_at       timestamptz not null default now(),
  -- Measurements
  systolic_bp       integer,    -- mmHg
  diastolic_bp      integer,    -- mmHg
  heart_rate        integer,    -- bpm
  respiratory_rate  integer,    -- breaths/min
  temperature_f     numeric(4,1),  -- °F
  weight_lbs        numeric(5,1),
  height_in         numeric(4,1),
  bmi               numeric(4,1) generated always as (
    case when height_in > 0 then round((weight_lbs / (height_in * height_in)) * 703, 1) else null end
  ) stored,
  spo2_pct          integer,    -- % oxygen saturation
  pain_scale        integer check (pain_scale between 0 and 10),
  notes             text,
  created_at        timestamptz not null default now()
);

-- ─── Allergies ───────────────────────────────────────────────
create table allergies (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  allergen        text not null,
  reaction        text,
  severity        allergy_severity not null default 'moderate',
  onset_date      date,
  is_active       boolean not null default true,
  recorded_by     uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Immunizations ───────────────────────────────────────────
create table immunizations (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  vaccine_name    text not null,
  lot_number      text,
  administered_at date not null,
  administered_by uuid references profiles(id) on delete set null,
  site            text,       -- 'left arm', 'right arm', etc.
  route           text,       -- 'intramuscular', 'subcutaneous', etc.
  next_due_date   date,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ─── Medications / Prescriptions ─────────────────────────────
create table prescriptions (
  id                  uuid primary key default uuid_generate_v4(),
  patient_id          uuid not null references patients(id) on delete cascade,
  prescriber_id       uuid not null references profiles(id) on delete cascade,
  appointment_id      uuid references appointments(id) on delete set null,
  drug_name           text not null,
  drug_generic_name   text,
  dosage              text not null,    -- e.g. '500mg'
  frequency           text not null,    -- e.g. 'twice daily'
  route               text,             -- oral, IV, topical, etc.
  quantity            integer,
  refills_allowed     integer not null default 0,
  refills_remaining   integer not null default 0,
  status              prescription_status not null default 'active',
  start_date          date not null default current_date,
  end_date            date,
  instructions        text,
  -- Drug interaction flag (stub for future API integration)
  interaction_flagged boolean not null default false,
  interaction_notes   text,
  discontinued_by     uuid references profiles(id) on delete set null,
  discontinued_at     timestamptz,
  discontinued_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Lab Orders ──────────────────────────────────────────────
create table lab_orders (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  ordering_provider_id uuid not null references profiles(id) on delete cascade,
  appointment_id  uuid references appointments(id) on delete set null,
  test_name       text not null,
  test_code       text,           -- LOINC code stub
  priority        text not null default 'routine',  -- routine, urgent, stat
  status          lab_order_status not null default 'ordered',
  ordered_at      timestamptz not null default now(),
  collected_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Lab Results ─────────────────────────────────────────────
create table lab_results (
  id              uuid primary key default uuid_generate_v4(),
  lab_order_id    uuid not null references lab_orders(id) on delete cascade,
  patient_id      uuid not null references patients(id) on delete cascade,
  resulted_at     timestamptz not null default now(),
  -- Result data
  component_name  text not null,
  value           text not null,
  unit            text,
  reference_low   text,
  reference_high  text,
  flag            lab_result_flag not null default 'normal',
  -- Notification
  provider_notified    boolean not null default false,
  provider_notified_at timestamptz,
  -- File attachment (Supabase Storage object path)
  attachment_path text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ─── Billing / Invoices ──────────────────────────────────────
create table invoices (
  id                    uuid primary key default uuid_generate_v4(),
  patient_id            uuid not null references patients(id) on delete cascade,
  appointment_id        uuid references appointments(id) on delete set null,
  invoice_number        text unique not null,
  status                billing_status not null default 'draft',
  -- Amounts (in cents to avoid float issues)
  subtotal_cents        integer not null default 0,
  discount_cents        integer not null default 0,
  tax_cents             integer not null default 0,
  total_cents           integer not null default 0,
  paid_cents            integer not null default 0,
  -- Insurance claim
  insurance_provider    text,
  insurance_claim_num   text,
  insurance_amount_cents integer not null default 0,
  -- Dates
  issued_at             timestamptz not null default now(),
  due_at                timestamptz,
  paid_at               timestamptz,
  -- Line items stored as JSONB [{description, cpt_code, quantity, unit_price_cents}]
  line_items            jsonb not null default '[]',
  notes                 text,
  created_by            uuid references profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create sequence invoice_seq start 10001;
alter table invoices alter column invoice_number set default 'INV-' || lpad(nextval('invoice_seq')::text, 5, '0');

-- ─── Documents ───────────────────────────────────────────────
create table documents (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  uploaded_by     uuid not null references profiles(id) on delete cascade,
  doc_type        document_type not null default 'other',
  title           text not null,
  description     text,
  -- Supabase Storage
  storage_bucket  text not null default 'documents',
  storage_path    text not null,    -- path inside bucket (private, use signed URLs)
  file_name       text not null,
  file_size_bytes bigint,
  mime_type       text,
  created_at      timestamptz not null default now()
);

-- ─── Consent Forms ───────────────────────────────────────────
create table consent_forms (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  form_type       text not null,     -- 'general_consent', 'hipaa_notice', 'treatment_consent'
  signed          boolean not null default false,
  signed_at       timestamptz,
  signed_by_name  text,
  ip_address      text,
  document_id     uuid references documents(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ─── Messages ────────────────────────────────────────────────
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  sender_id       uuid not null references profiles(id) on delete cascade,
  recipient_id    uuid not null references profiles(id) on delete cascade,
  patient_id      uuid references patients(id) on delete cascade,  -- context
  subject         text,
  body            text not null,
  status          message_status not null default 'sent',
  read_at         timestamptz,
  parent_id       uuid references messages(id) on delete cascade,  -- threading
  created_at      timestamptz not null default now()
);

-- ─── Audit Logs ──────────────────────────────────────────────
create table audit_logs (
  id              uuid primary key default uuid_generate_v4(),
  actor_id        uuid references profiles(id) on delete set null,
  action          audit_action not null,
  table_name      text not null,
  record_id       text,           -- UUID of the affected record
  patient_id      uuid references patients(id) on delete set null,  -- for patient-scoped events
  changes         jsonb,          -- {old: {...}, new: {...}} - no PHI values, only field names + non-PHI data
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_patients_mrn           on patients(mrn);
create index idx_patients_name          on patients(last_name, first_name);
create index idx_patients_profile_id    on patients(profile_id);
create index idx_care_team_patient      on care_team(patient_id);
create index idx_care_team_provider     on care_team(provider_id);
create index idx_appointments_patient   on appointments(patient_id);
create index idx_appointments_provider  on appointments(provider_id);
create index idx_appointments_scheduled on appointments(scheduled_at);
create index idx_clinical_notes_patient on clinical_notes(patient_id);
create index idx_vitals_patient_time    on vitals(patient_id, recorded_at desc);
create index idx_prescriptions_patient  on prescriptions(patient_id);
create index idx_lab_orders_patient     on lab_orders(patient_id);
create index idx_lab_results_order      on lab_results(lab_order_id);
create index idx_invoices_patient       on invoices(patient_id);
create index idx_documents_patient      on documents(patient_id);
create index idx_messages_recipient     on messages(recipient_id, created_at desc);
create index idx_audit_logs_actor       on audit_logs(actor_id, created_at desc);
create index idx_audit_logs_patient     on audit_logs(patient_id, created_at desc);
create index idx_audit_logs_table       on audit_logs(table_name, created_at desc);

-- ─── Updated_at triggers ─────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated        before update on profiles        for each row execute function update_updated_at();
create trigger trg_patients_updated        before update on patients        for each row execute function update_updated_at();
create trigger trg_appointments_updated    before update on appointments    for each row execute function update_updated_at();
create trigger trg_clinical_notes_updated  before update on clinical_notes  for each row execute function update_updated_at();
create trigger trg_allergies_updated       before update on allergies       for each row execute function update_updated_at();
create trigger trg_prescriptions_updated   before update on prescriptions   for each row execute function update_updated_at();
create trigger trg_lab_orders_updated      before update on lab_orders      for each row execute function update_updated_at();
create trigger trg_invoices_updated        before update on invoices        for each row execute function update_updated_at();

-- ─── Auto-create profile on auth.users insert ────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, first_name, last_name, role)
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
