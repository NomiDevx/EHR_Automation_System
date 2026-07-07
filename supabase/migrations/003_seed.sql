-- ============================================================
-- EHR System — Migration 003: Seed Data (Demo)
-- Run AFTER 002_rls.sql
-- NOTE: This uses auth.users inserts — run as service role or
--       use the Supabase Dashboard Auth UI to create users first,
--       then run the profile/patient data below.
-- ============================================================

-- ─── Demo Auth Users ──────────────────────────────────────────
-- Insert into auth.users first so foreign key constraints on profiles are satisfied.
-- Passwords for all demo accounts: Demo@12345
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  -- Staff
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@ehr.demo',       crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Alex","last_name":"Admin","role":"admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'dr.smith@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"James","last_name":"Smith","role":"doctor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'dr.patel@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Priya","last_name":"Patel","role":"doctor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'nurse.jones@ehr.demo', crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Sandra","last_name":"Jones","role":"nurse"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'nurse.kim@ehr.demo',   crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Kevin","last_name":"Kim","role":"nurse"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'reception@ehr.demo',   crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Rachel","last_name":"Green","role":"receptionist"}', now(), now(), '', '', '', ''),
  -- Patients
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000001', 'authenticated', 'authenticated', 'patient1@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"James","last_name":"Carter","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000002', 'authenticated', 'authenticated', 'patient2@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Maria","last_name":"Santos","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000003', 'authenticated', 'authenticated', 'patient3@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Robert","last_name":"Johnson","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000004', 'authenticated', 'authenticated', 'patient4@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Linda","last_name":"Williams","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000005', 'authenticated', 'authenticated', 'patient5@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Michael","last_name":"Brown","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000006', 'authenticated', 'authenticated', 'patient6@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Patricia","last_name":"Davis","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000007', 'authenticated', 'authenticated', 'patient7@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"David","last_name":"Miller","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000008', 'authenticated', 'authenticated', 'patient8@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Jennifer","last_name":"Wilson","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000009', 'authenticated', 'authenticated', 'patient9@ehr.demo',    crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Charles","last_name":"Moore","role":"patient"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000010', 'authenticated', 'authenticated', 'patient10@ehr.demo',   crypt('Demo@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Barbara","last_name":"Taylor","role":"patient"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- Profiles (staff)
insert into profiles (id, role, first_name, last_name, email, phone, specialty, department, npi_number) values
  ('00000000-0000-0000-0000-000000000001', 'admin',        'Alex',    'Admin',      'admin@ehr.demo',        '555-000-0001', null,            'Administration', null),
  ('00000000-0000-0000-0000-000000000002', 'doctor',       'James',   'Smith',      'dr.smith@ehr.demo',     '555-000-0002', 'Internal Medicine', 'Medicine',   '1234567890'),
  ('00000000-0000-0000-0000-000000000003', 'doctor',       'Priya',   'Patel',      'dr.patel@ehr.demo',     '555-000-0003', 'Cardiology',    'Cardiology',     '0987654321'),
  ('00000000-0000-0000-0000-000000000004', 'nurse',        'Sandra',  'Jones',      'nurse.jones@ehr.demo',  '555-000-0004', null,            'Medicine',       null),
  ('00000000-0000-0000-0000-000000000005', 'nurse',        'Kevin',   'Kim',        'nurse.kim@ehr.demo',    '555-000-0005', null,            'Cardiology',     null),
  ('00000000-0000-0000-0000-000000000006', 'receptionist', 'Rachel',  'Green',      'reception@ehr.demo',    '555-000-0006', null,            'Front Desk',     null)
on conflict (id) do update set
  role = excluded.role,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone,
  specialty = excluded.specialty,
  department = excluded.department,
  npi_number = excluded.npi_number;

-- Profiles (patients — linked to portal accounts)
insert into profiles (id, role, first_name, last_name, email, phone) values
  ('00000000-0000-0000-0001-000000000001', 'patient', 'James',    'Carter',    'patient1@ehr.demo',   '555-100-0001'),
  ('00000000-0000-0000-0001-000000000002', 'patient', 'Maria',    'Santos',    'patient2@ehr.demo',   '555-100-0002'),
  ('00000000-0000-0000-0001-000000000003', 'patient', 'Robert',   'Johnson',   'patient3@ehr.demo',   '555-100-0003'),
  ('00000000-0000-0000-0001-000000000004', 'patient', 'Linda',    'Williams',  'patient4@ehr.demo',   '555-100-0004'),
  ('00000000-0000-0000-0001-000000000005', 'patient', 'Michael',  'Brown',     'patient5@ehr.demo',   '555-100-0005'),
  ('00000000-0000-0000-0001-000000000006', 'patient', 'Patricia', 'Davis',     'patient6@ehr.demo',   '555-100-0006'),
  ('00000000-0000-0000-0001-000000000007', 'patient', 'David',    'Miller',    'patient7@ehr.demo',   '555-100-0007'),
  ('00000000-0000-0000-0001-000000000008', 'patient', 'Jennifer', 'Wilson',    'patient8@ehr.demo',   '555-100-0008'),
  ('00000000-0000-0000-0001-000000000009', 'patient', 'Charles',  'Moore',     'patient9@ehr.demo',   '555-100-0009'),
  ('00000000-0000-0000-0001-000000000010', 'patient', 'Barbara',  'Taylor',    'patient10@ehr.demo',  '555-100-0010')
on conflict (id) do update set
  role = excluded.role,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone;

-- ─── Patients ─────────────────────────────────────────────────
insert into patients (id, profile_id, mrn, first_name, last_name, date_of_birth, gender, email, phone,
  address_line1, city, state, zip_code,
  emergency_name, emergency_relationship, emergency_phone,
  insurance_provider, insurance_policy_num, insurance_group_num,
  primary_provider_id, consent_obtained, consent_date, is_active) values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'MRN-100001', 'James', 'Carter', '1978-03-15', 'male',
    'patient1@ehr.demo', '555-100-0001',
    '123 Oak St', 'Springfield', 'IL', '62701',
    'Mary Carter', 'Spouse', '555-100-9001',
    'BlueCross', 'BC-JC-78315', 'GRP-001',
    '00000000-0000-0000-0000-000000000002',
    true, now() - interval '2 years', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0001-000000000002',
    'MRN-100002', 'Maria', 'Santos', '1990-07-22', 'female',
    'patient2@ehr.demo', '555-100-0002',
    '456 Elm Ave', 'Springfield', 'IL', '62702',
    'Carlos Santos', 'Brother', '555-100-9002',
    'Aetna', 'AE-MS-90722', 'GRP-002',
    '00000000-0000-0000-0000-000000000003',
    true, now() - interval '1 year', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0001-000000000003',
    'MRN-100003', 'Robert', 'Johnson', '1955-11-08', 'male',
    'patient3@ehr.demo', '555-100-0003',
    '789 Maple Dr', 'Shelbyville', 'IL', '62565',
    'Dorothy Johnson', 'Spouse', '555-100-9003',
    'UnitedHealth', 'UH-RJ-55118', 'GRP-003',
    '00000000-0000-0000-0000-000000000002',
    true, now() - interval '3 years', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    '00000000-0000-0000-0001-000000000004',
    'MRN-100004', 'Linda', 'Williams', '1965-05-30', 'female',
    'patient4@ehr.demo', '555-100-0004',
    '321 Pine Rd', 'Capital City', 'IL', '62703',
    'Tom Williams', 'Son', '555-100-9004',
    'Cigna', 'CG-LW-65530', 'GRP-001',
    '00000000-0000-0000-0000-000000000003',
    true, now() - interval '18 months', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000005',
    '00000000-0000-0000-0001-000000000005',
    'MRN-100005', 'Michael', 'Brown', '1982-09-14', 'male',
    'patient5@ehr.demo', '555-100-0005',
    '654 Cedar Ln', 'Springfield', 'IL', '62704',
    'Susan Brown', 'Spouse', '555-100-9005',
    'BlueCross', 'BC-MB-82914', 'GRP-002',
    '00000000-0000-0000-0000-000000000002',
    true, now() - interval '6 months', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000006',
    '00000000-0000-0000-0001-000000000006',
    'MRN-100006', 'Patricia', 'Davis', '1945-02-17', 'female',
    'patient6@ehr.demo', '555-100-0006',
    '987 Birch Blvd', 'Shelbyville', 'IL', '62565',
    'John Davis', 'Son', '555-100-9006',
    'Medicare', 'MC-PD-45217', 'GRP-004',
    '00000000-0000-0000-0000-000000000003',
    true, now() - interval '4 years', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000007',
    '00000000-0000-0000-0001-000000000007',
    'MRN-100007', 'David', 'Miller', '1970-12-03', 'male',
    'patient7@ehr.demo', '555-100-0007',
    '147 Walnut Way', 'Capital City', 'IL', '62703',
    'Anne Miller', 'Spouse', '555-100-9007',
    'Aetna', 'AE-DM-70123', 'GRP-003',
    '00000000-0000-0000-0000-000000000002',
    true, now() - interval '1 year', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000008',
    '00000000-0000-0000-0001-000000000008',
    'MRN-100008', 'Jennifer', 'Wilson', '1995-08-19', 'female',
    'patient8@ehr.demo', '555-100-0008',
    '258 Spruce St', 'Springfield', 'IL', '62701',
    'Mark Wilson', 'Parent', '555-100-9008',
    'UnitedHealth', 'UH-JW-95819', 'GRP-002',
    '00000000-0000-0000-0000-000000000003',
    true, now() - interval '8 months', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000009',
    '00000000-0000-0000-0001-000000000009',
    'MRN-100009', 'Charles', 'Moore', '1958-04-25', 'male',
    'patient9@ehr.demo', '555-100-0009',
    '369 Ash Ave', 'Shelbyville', 'IL', '62565',
    'Gloria Moore', 'Spouse', '555-100-9009',
    'Cigna', 'CG-CM-58425', 'GRP-001',
    '00000000-0000-0000-0000-000000000002',
    true, now() - interval '5 years', true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000010',
    '00000000-0000-0000-0001-000000000010',
    'MRN-100010', 'Barbara', 'Taylor', '1987-06-11', 'female',
    'patient10@ehr.demo', '555-100-0010',
    '741 Hickory Ct', 'Capital City', 'IL', '62703',
    'Paul Taylor', 'Spouse', '555-100-9010',
    'BlueCross', 'BC-BT-87611', 'GRP-003',
    '00000000-0000-0000-0000-000000000003',
    true, now() - interval '3 months', true
  )
on conflict (id) do nothing;

-- ─── Care Team ────────────────────────────────────────────────
insert into care_team (patient_id, provider_id, role) values
  -- Dr. Smith's patients
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'primary'),
  -- Dr. Patel's patients
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'primary'),
  ('aaaaaaaa-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', 'primary'),
  -- Nurses assist across
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'nursing'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'nursing'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'nursing'),
  -- Cross-coverage: Dr. Patel consulted on patient 1 (cardiac)
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'consulting')
on conflict do nothing;

-- ─── Appointments ─────────────────────────────────────────────
insert into appointments (id, patient_id, provider_id, type, status, scheduled_at, duration_mins, chief_complaint, created_by) values
  -- Past appointments
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'follow_up', 'completed', now() - interval '30 days', 30, 'Hypertension follow-up', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'new_patient', 'completed', now() - interval '14 days', 45, 'Chest pain evaluation', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'follow_up', 'completed', now() - interval '7 days', 30, 'Diabetes management', '00000000-0000-0000-0000-000000000006'),
  -- Today / upcoming
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'wellness', 'confirmed', now() + interval '2 hours', 60, 'Annual physical', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'urgent', 'scheduled', now() + interval '1 day', 30, 'Acute back pain', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'follow_up', 'scheduled', now() + interval '3 days', 30, 'BP medication review', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'follow_up', 'scheduled', now() + interval '5 days', 45, 'CHF monitoring', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'new_patient', 'scheduled', now() + interval '7 days', 45, 'New patient intake', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'telehealth', 'scheduled', now() + interval '10 days', 30, 'Post-op follow-up', '00000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'follow_up', 'confirmed', now() + interval '2 days', 30, 'Lipid panel review', '00000000-0000-0000-0000-000000000006')
on conflict (id) do nothing;

-- ─── Clinical Notes ───────────────────────────────────────────
insert into clinical_notes (id, patient_id, provider_id, appointment_id, status, subjective, objective, assessment, plan, signed_at, signed_by) values
  (
    'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'signed',
    'Patient reports persistent headaches and occasional dizziness over the past 2 weeks. Denies chest pain or shortness of breath. Medication adherence is good per patient report.',
    'BP 148/92 mmHg (left arm, seated). HR 78 bpm, regular. RR 16. Temp 98.4°F. Weight 185 lbs. Physical exam: No papilledema. Heart regular rate and rhythm without murmurs.',
    'Essential hypertension, inadequately controlled (ICD-10: I10). Likely related to increased salt intake and work-related stress.',
    '1. Increase lisinopril from 10mg to 20mg daily. 2. Low-sodium diet counseling provided. 3. Return in 4 weeks for BP recheck. 4. Labs: BMP ordered to monitor potassium on ACE inhibitor. 5. Referral to nutritionist placed.',
    now() - interval '30 days',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'signed',
    'Patient is a 35-year-old female presenting with 3-day history of intermittent chest pain, 5/10 severity, non-radiating, associated with exertion. No syncope or palpitations.',
    'BP 122/78, HR 88 bpm, RR 16, SpO2 99% on room air. ECG: Normal sinus rhythm, no ST changes. Cardiac exam: Regular rate/rhythm, no murmurs, rubs, or gallops.',
    'Atypical chest pain. Low-intermediate risk for ACS. Possible musculoskeletal or GERD etiology.',
    '1. Troponin x2 q6h — both negative. 2. Stress echo scheduled in 2 weeks. 3. Start omeprazole 20mg daily for empiric GERD treatment. 4. Return precautions given. 5. Follow-up in 2 weeks.',
    now() - interval '14 days',
    '00000000-0000-0000-0000-000000000003'
  ),
  (
    'cccccccc-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'signed',
    'Patient with Type 2 DM reporting home glucose readings consistently 180-240 mg/dL over past month. Has been less active due to knee pain. HbA1c was 8.9% 3 months ago.',
    'BP 134/84. HR 76. Weight 218 lbs (up 3 lbs from last visit). Fasting glucose today: 214 mg/dL. Feet: no ulcers, intact sensation to monofilament testing. Eyes: referred to ophthalmology.',
    'Type 2 Diabetes Mellitus, uncontrolled (ICD-10: E11.65). Hypertension (ICD-10: I10). Overweight.',
    '1. Increase metformin to 1000mg twice daily. 2. Add glipizide 5mg daily with breakfast. 3. Repeat HbA1c in 3 months. 4. Podiatry referral for annual foot exam. 5. Dietary counseling for carbohydrate counting. 6. Encourage 30 min walking 5x/week.',
    now() - interval '7 days',
    '00000000-0000-0000-0000-000000000002'
  )
on conflict (id) do nothing;

-- ─── Vitals ───────────────────────────────────────────────────
insert into vitals (patient_id, recorded_by, appointment_id, recorded_at, systolic_bp, diastolic_bp, heart_rate, temperature_f, weight_lbs, height_in, spo2_pct, pain_scale) values
  -- Patient 1 (James Carter) — multiple readings for trend chart
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', now()-interval '30 days', 148, 92, 78, 98.4, 185, 70, 98, 2),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', null, now()-interval '60 days', 155, 96, 82, 98.6, 188, 70, 97, 3),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', null, now()-interval '90 days', 160, 99, 80, 98.2, 190, 70, 98, 1),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', null, now()-interval '120 days', 162, 101, 84, 98.8, 191, 70, 97, 0),
  -- Patient 2 (Maria Santos)
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002', now()-interval '14 days', 122, 78, 88, 98.6, 135, 65, 99, 5),
  -- Patient 3 (Robert Johnson) — diabetic, more readings
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000003', now()-interval '7 days', 134, 84, 76, 98.2, 218, 68, 97, 1),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', null, now()-interval '37 days', 138, 88, 78, 98.4, 215, 68, 96, 0),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', null, now()-interval '67 days', 142, 90, 80, 98.0, 213, 68, 97, 2)
on conflict do nothing;

-- ─── Allergies ────────────────────────────────────────────────
insert into allergies (patient_id, allergen, reaction, severity, onset_date, recorded_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Penicillin', 'Hives, anaphylaxis', 'life_threatening', '1995-06-01', '00000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Sulfa drugs', 'Rash', 'mild', '2010-03-15', '00000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Latex', 'Contact dermatitis', 'moderate', '2018-01-01', '00000000-0000-0000-0000-000000000003'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Aspirin', 'GI bleeding', 'severe', '2005-08-20', '00000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Shellfish', 'Anaphylaxis', 'life_threatening', '1988-05-10', '00000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'ACE inhibitors', 'Angioedema', 'severe', '2015-11-03', '00000000-0000-0000-0000-000000000003')
on conflict do nothing;

-- ─── Immunizations ────────────────────────────────────────────
insert into immunizations (patient_id, vaccine_name, lot_number, administered_at, administered_by, site, route) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Influenza (seasonal)', 'FLU-2024-001', '2024-10-15', '00000000-0000-0000-0000-000000000004', 'Left arm', 'intramuscular'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'COVID-19 Booster (Moderna)', 'COV-2024-055', '2024-09-01', '00000000-0000-0000-0000-000000000004', 'Right arm', 'intramuscular'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tdap', 'TDAP-2020-033', '2020-03-10', '00000000-0000-0000-0000-000000000004', 'Left arm', 'intramuscular'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Influenza (seasonal)', 'FLU-2024-002', '2024-10-20', '00000000-0000-0000-0000-000000000005', 'Right arm', 'intramuscular'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Pneumococcal (PPSV23)', 'PNM-2022-011', '2022-05-15', '00000000-0000-0000-0000-000000000004', 'Left arm', 'intramuscular'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Influenza (seasonal)', 'FLU-2024-003', '2024-11-01', '00000000-0000-0000-0000-000000000004', 'Right arm', 'intramuscular')
on conflict do nothing;

-- ─── Prescriptions ────────────────────────────────────────────
insert into prescriptions (patient_id, prescriber_id, appointment_id, drug_name, drug_generic_name, dosage, frequency, route, quantity, refills_allowed, refills_remaining, status, start_date, instructions) values
  -- Patient 1 (Hypertension)
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Zestril', 'Lisinopril', '20mg', 'once daily', 'oral', 30, 3, 3, 'active', current_date - 30, 'Take in the morning. Monitor for dry cough.'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', null, 'Norvasc', 'Amlodipine', '5mg', 'once daily', 'oral', 30, 5, 5, 'active', current_date - 90, 'Take at the same time each day.'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', null, 'Pepcid', 'Famotidine', '20mg', 'twice daily', 'oral', 60, 2, 2, 'active', current_date - 45, 'Take 30 minutes before meals.'),
  -- Patient 2 (Cardiology)
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Prilosec', 'Omeprazole', '20mg', 'once daily', 'oral', 30, 2, 2, 'active', current_date - 14, 'Take before breakfast.'),
  -- Patient 3 (Diabetes)
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'Glucophage', 'Metformin', '1000mg', 'twice daily', 'oral', 60, 5, 5, 'active', current_date - 7, 'Take with meals to reduce GI side effects.'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'Glucotrol', 'Glipizide', '5mg', 'once daily', 'oral', 30, 3, 3, 'active', current_date - 7, 'Take with breakfast.'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', null, 'Zocor', 'Simvastatin', '20mg', 'once daily', 'oral', 30, 5, 4, 'active', current_date - 180, 'Take in the evening.'),
  -- Discontinued example
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', null, 'Prinivil', 'Lisinopril', '10mg', 'once daily', 'oral', 30, 0, 0, 'discontinued', current_date - 90, 'Previous lower dose — discontinued when dose increased.')
on conflict do nothing;

-- ─── Lab Orders & Results ─────────────────────────────────────
insert into lab_orders (id, patient_id, ordering_provider_id, appointment_id, test_name, test_code, priority, status, ordered_at, collected_at) values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Basic Metabolic Panel', 'BMP', 'routine', 'resulted', now()-interval '30 days', now()-interval '29 days'),
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'Hemoglobin A1c', 'HbA1c', 'routine', 'resulted', now()-interval '7 days', now()-interval '6 days'),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'Comprehensive Metabolic Panel', 'CMP', 'routine', 'resulted', now()-interval '7 days', now()-interval '6 days'),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Troponin I', 'TROP-I', 'stat', 'resulted', now()-interval '14 days', now()-interval '14 days'),
  ('dddddddd-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', null, 'Lipid Panel', 'LIPID', 'routine', 'ordered', now()-interval '1 day', null)
on conflict (id) do nothing;

insert into lab_results (lab_order_id, patient_id, resulted_at, component_name, value, unit, reference_low, reference_high, flag) values
  -- BMP for Patient 1
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', now()-interval '28 days', 'Sodium', '140', 'mEq/L', '136', '145', 'normal'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', now()-interval '28 days', 'Potassium', '3.3', 'mEq/L', '3.5', '5.0', 'low'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', now()-interval '28 days', 'Creatinine', '1.1', 'mg/dL', '0.6', '1.2', 'normal'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', now()-interval '28 days', 'BUN', '18', 'mg/dL', '7', '25', 'normal'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', now()-interval '28 days', 'Glucose', '105', 'mg/dL', '70', '100', 'high'),
  -- HbA1c for Patient 3
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', now()-interval '5 days', 'Hemoglobin A1c', '8.9', '%', '4.0', '5.6', 'critical_high'),
  -- CMP for Patient 3
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', now()-interval '5 days', 'Fasting Glucose', '214', 'mg/dL', '70', '100', 'critical_high'),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', now()-interval '5 days', 'ALT', '32', 'U/L', '7', '56', 'normal'),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', now()-interval '5 days', 'Creatinine', '0.9', 'mg/dL', '0.6', '1.2', 'normal'),
  -- Troponin for Patient 2
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', now()-interval '14 days', 'Troponin I (initial)', '0.01', 'ng/mL', '0', '0.04', 'normal'),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', now()-interval '13 days 18 hours', 'Troponin I (6h)', '0.02', 'ng/mL', '0', '0.04', 'normal')
on conflict do nothing;

-- ─── Invoices ─────────────────────────────────────────────────
insert into invoices (patient_id, appointment_id, invoice_number, status, subtotal_cents, total_cents, paid_cents, insurance_provider, insurance_amount_cents, issued_at, due_at, line_items, created_by) values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'INV-10001', 'paid',
    25000, 25000, 25000,
    'BlueCross', 20000,
    now()-interval '30 days', now()-interval '15 days',
    '[{"description":"Office Visit - Follow Up (99213)","cpt_code":"99213","quantity":1,"unit_price_cents":25000}]',
    '00000000-0000-0000-0000-000000000006'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'INV-10002', 'submitted',
    45000, 45000, 0,
    'Aetna', 36000,
    now()-interval '14 days', now()+interval '16 days',
    '[{"description":"New Patient Visit (99204)","cpt_code":"99204","quantity":1,"unit_price_cents":35000},{"description":"ECG Interpretation","cpt_code":"93000","quantity":1,"unit_price_cents":10000}]',
    '00000000-0000-0000-0000-000000000006'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'INV-10003', 'draft',
    30000, 30000, 0,
    'UnitedHealth', 24000,
    now()-interval '7 days', now()+interval '23 days',
    '[{"description":"Office Visit - Follow Up (99214)","cpt_code":"99214","quantity":1,"unit_price_cents":30000}]',
    '00000000-0000-0000-0000-000000000006'
  )
on conflict do nothing;

-- ─── Messages ─────────────────────────────────────────────────
insert into messages (sender_id, recipient_id, patient_id, subject, body, status, read_at) values
  (
    '00000000-0000-0000-0001-000000000001',  -- Patient 1 (James Carter)
    '00000000-0000-0000-0000-000000000002',  -- Dr. Smith
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Question about my blood pressure medication',
    'Dr. Smith, I have been taking the new 20mg lisinopril for 2 weeks and I have developed a dry cough. Is this normal? Should I be concerned?',
    'read',
    now()-interval '25 days'
  ),
  (
    '00000000-0000-0000-0000-000000000002',  -- Dr. Smith
    '00000000-0000-0000-0001-000000000001',  -- Patient 1
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Re: Question about my blood pressure medication',
    'Hi James, dry cough is a known side effect of ACE inhibitors like lisinopril, affecting about 10-15% of patients. It is not dangerous, but if it is bothersome, we can switch you to a different class of medication at your next visit. Please call us if it worsens.',
    'read',
    now()-interval '24 days'
  ),
  (
    '00000000-0000-0000-0001-000000000002',  -- Patient 2 (Maria Santos)
    '00000000-0000-0000-0000-000000000003',  -- Dr. Patel
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Stress echo appointment',
    'Dr. Patel, I received the referral for the stress echo. The earliest they can see me is 3 weeks out. Is that okay or should I go to the ER if symptoms return?',
    'delivered',
    null
  )
on conflict do nothing;

-- ─── Consent Forms ────────────────────────────────────────────
insert into consent_forms (patient_id, form_type, signed, signed_at, signed_by_name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general_consent', true, now()-interval '2 years', 'James Carter'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'hipaa_notice', true, now()-interval '2 years', 'James Carter'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'general_consent', true, now()-interval '1 year', 'Maria Santos'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'hipaa_notice', true, now()-interval '1 year', 'Maria Santos'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'general_consent', true, now()-interval '3 years', 'Robert Johnson'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'hipaa_notice', true, now()-interval '3 years', 'Robert Johnson')
on conflict do nothing;
