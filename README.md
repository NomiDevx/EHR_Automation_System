# MediCore EHR System

> ⚠️ **DEMO / PORTFOLIO PROJECT** — This is not a certified HIPAA-compliant system. It is built to demonstrate EHR architecture, full-stack patterns, and clinical workflows. Do not use this to store real patient data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom design system |
| UI Components | Custom Radix UI-based components |
| State / Data | Supabase JS + TanStack React Query |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Storage | Supabase Storage (private buckets) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

---

## Roles & Credentials (Demo)

All demo accounts use password: **`Demo@12345`**

| Role | Email | Access |
|---|---|---|
| Admin | `admin@ehr.demo` | Full system, user management, audit logs |
| Doctor | `dr.smith@ehr.demo` | Patient charts, SOAP notes, prescriptions, labs |
| Doctor | `dr.patel@ehr.demo` | Same as above (Cardiology) |
| Nurse | `nurse.jones@ehr.demo` | Vitals entry, patient charting |
| Nurse | `nurse.kim@ehr.demo` | Same as above |
| Receptionist | `reception@ehr.demo` | Scheduling, patient registration, billing |
| Patient | `patient1@ehr.demo` | Personal portal (James Carter) |
| Patient | `patient2@ehr.demo` | Personal portal (Maria Santos) |

---

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project (already configured)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Ensure `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migrations

Go to your **Supabase Dashboard → SQL Editor** and run these files in order:

1. `supabase/migrations/001_schema.sql` — Creates all tables, enums, indexes, and triggers
2. `supabase/migrations/002_rls.sql` — Enables RLS and creates all policies
3. `supabase/migrations/003_seed.sql` — Inserts demo data (staff + 10 patients)

### 4. Create Auth Users in Supabase Dashboard

Go to **Authentication → Users → Add User** and create these accounts (email confirmed):

```
admin@ehr.demo        — password: Demo@12345
dr.smith@ehr.demo     — password: Demo@12345
dr.patel@ehr.demo     — password: Demo@12345
nurse.jones@ehr.demo  — password: Demo@12345
nurse.kim@ehr.demo    — password: Demo@12345
reception@ehr.demo    — password: Demo@12345
patient1@ehr.demo     — password: Demo@12345
patient2@ehr.demo     — password: Demo@12345
```

> **Important:** The UUIDs in the seed file (`003_seed.sql`) are hardcoded. To make profiles link correctly, after running the seed, map the Supabase auth user UUIDs to the profile UUIDs by updating the `profiles` table `id` values — or use the Supabase service role to insert auth users with specific UUIDs.

### 5. Create Storage Buckets

In **Supabase Dashboard → Storage → New Bucket**:
- `documents` — Set to **Private**
- `avatars` — Set to **Private**

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Application Features

### ✅ Auth & Onboarding
- Email/password login with role-based redirect
- Patient self-registration
- Session timeout with configurable inactivity timer (30 min staff, 60 min patients)

### ✅ Patient Management
- Global search by name, MRN, email, phone
- Full chart view with tabbed sections
- Demographics, allergies, immunizations

### ✅ Clinical Documentation
- SOAP note editor (Subjective / Objective / Assessment / Plan)
- Sign-and-lock notes (no edits after signing)
- Addenda for signed notes
- Note history per patient

### ✅ Scheduling
- Week calendar view + list view
- Provider filter, status filter
- Real-time conflict detection
- Book / view appointments

### ✅ e-Prescribing
- Prescription form with full drug details
- Allergy cross-check alert (compares drug name to allergy list)
- Drug interaction warning stub (⚠️ stub — not connected to a real API)
- Active / inactive medication history

### ✅ Lab Workflow
- Lab order creation
- Result entry with reference ranges
- Abnormal value flagging (color-coded)
- Results visible in patient portal

### ✅ Vitals & Nursing
- Quick vitals entry form
- Blood pressure trend chart (Recharts)
- Historical vitals table with color flags (high BP, low SpO₂)

### ✅ Billing
- Invoice list with search and status filters
- Summary stats (billed / collected / outstanding)
- Mark paid action

### ✅ Patient Portal
- Personalized dashboard
- Upcoming appointments
- Lab results with flags
- Active medications
- Secure messaging with providers

### ✅ Admin Dashboard
- System-wide stats
- User management (search, filter by role, activate/deactivate)
- Audit log viewer (searchable, action filters)

---

## Database Schema

13 tables with full RLS:

```
profiles        → Extends auth.users with role + provider info
patients        → Demographics, insurance, emergency contact
care_team       → Many-to-many: providers ↔ patients
appointments    → Scheduling with status lifecycle
clinical_notes  → SOAP format, sign-and-lock, addenda
vitals          → Time-series vitals measurements
allergies       → Patient allergy list with severity
immunizations   → Vaccine history
prescriptions   → e-Rx with drug info and refill tracking
lab_orders      → Lab test orders
lab_results     → Results with reference ranges and flags
invoices        → Billing with line items (JSONB) and insurance fields
documents       → File metadata (Supabase Storage paths)
consent_forms   → Consent tracking
messages        → Secure patient-provider messaging
audit_logs      → Compliance event log
```

---

## Row Level Security

Every table has RLS enabled. Key rules:
- **Patients** see only their own records
- **Doctors/nurses** see patients on their care team
- **Receptionist** has read access to patients/appointments, manage access to billing
- **Admin** bypasses all restrictions (all admin actions are audit-logged)
- **No table** is publicly accessible

---

## Security Notes

- TLS enforced by Supabase for all traffic
- Storage buckets are private — signed URLs only
- Audit log records all create/read/update/delete/sign/export events
- Session timeout configured per role (inactivity-based)
- PHI is never included in application logs or audit log `changes` field

---

## Known Limitations (Demo Project)

- Drug interaction API is a stub (checks hardcoded drug names only)
- Email/SMS reminders are not implemented (stubs only)
- MFA is configurable in Supabase Auth but not enforced in UI
- Seed data uses hardcoded UUIDs that must match auth.users table
- Not a certified HIPAA system — for portfolio/learning use only
