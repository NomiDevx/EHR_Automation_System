// ─── Database Type Definitions ──────────────────────────────────────────────
// Generated from the Supabase schema. Update after schema changes.

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'new_patient' | 'follow_up' | 'urgent' | 'telehealth' | 'procedure' | 'wellness';
export type PrescriptionStatus = 'active' | 'discontinued' | 'completed' | 'on_hold';
export type LabOrderStatus = 'ordered' | 'collected' | 'in_progress' | 'resulted' | 'cancelled';
export type LabResultFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
export type BillingStatus = 'draft' | 'submitted' | 'paid' | 'partially_paid' | 'denied' | 'void';
export type NoteStatus = 'draft' | 'signed' | 'amended';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
export type DocumentType = 'consent_form' | 'referral' | 'lab_attachment' | 'imaging' | 'insurance_card' | 'id_document' | 'other';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'sign';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  npi_number: string | null;
  specialty: string | null;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  profile_id: string | null;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  ssn_encrypted: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  emergency_name: string | null;
  emergency_relationship: string | null;
  emergency_phone: string | null;
  insurance_provider: string | null;
  insurance_policy_num: string | null;
  insurance_group_num: string | null;
  insurance_holder_name: string | null;
  insurance_holder_dob: string | null;
  is_active: boolean;
  consent_obtained: boolean;
  consent_date: string | null;
  primary_provider_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  full_name?: string;
  age?: number;
}

export interface CareTeamMember {
  id: string;
  patient_id: string;
  provider_id: string;
  role: string;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  provider?: Profile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_mins: number;
  chief_complaint: string | null;
  notes: string | null;
  reminder_sent: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  provider?: Profile;
}

export interface Addendum {
  author_id: string;
  text: string;
  created_at: string;
  author_name?: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_id: string | null;
  status: NoteStatus;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  addenda: Addendum[];
  signed_at: string | null;
  signed_by: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  provider?: Profile;
  appointment?: Appointment;
}

export interface Vitals {
  id: string;
  patient_id: string;
  recorded_by: string;
  appointment_id: string | null;
  recorded_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature_f: number | null;
  weight_lbs: number | null;
  height_in: number | null;
  bmi: number | null;
  spo2_pct: number | null;
  pain_scale: number | null;
  notes: string | null;
  created_at: string;
  recorder?: Profile;
}

export interface Allergy {
  id: string;
  patient_id: string;
  allergen: string;
  reaction: string | null;
  severity: AllergySeverity;
  onset_date: string | null;
  is_active: boolean;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Immunization {
  id: string;
  patient_id: string;
  vaccine_name: string;
  lot_number: string | null;
  administered_at: string;
  administered_by: string | null;
  site: string | null;
  route: string | null;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  prescriber_id: string;
  appointment_id: string | null;
  drug_name: string;
  drug_generic_name: string | null;
  dosage: string;
  frequency: string;
  route: string | null;
  quantity: number | null;
  refills_allowed: number;
  refills_remaining: number;
  status: PrescriptionStatus;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  interaction_flagged: boolean;
  interaction_notes: string | null;
  discontinued_by: string | null;
  discontinued_at: string | null;
  discontinued_reason: string | null;
  created_at: string;
  updated_at: string;
  prescriber?: Profile;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  ordering_provider_id: string;
  appointment_id: string | null;
  test_name: string;
  test_code: string | null;
  priority: string;
  status: LabOrderStatus;
  ordered_at: string;
  collected_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  ordering_provider?: Profile;
  results?: LabResult[];
}

export interface LabResult {
  id: string;
  lab_order_id: string;
  patient_id: string;
  resulted_at: string;
  component_name: string;
  value: string;
  unit: string | null;
  reference_low: string | null;
  reference_high: string | null;
  flag: LabResultFlag;
  provider_notified: boolean;
  provider_notified_at: string | null;
  attachment_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface LineItem {
  description: string;
  cpt_code: string;
  quantity: number;
  unit_price_cents: number;
}

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_number: string;
  status: BillingStatus;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  paid_cents: number;
  insurance_provider: string | null;
  insurance_claim_num: string | null;
  insurance_amount_cents: number;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  line_items: LineItem[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

export interface Document {
  id: string;
  patient_id: string;
  uploaded_by: string;
  doc_type: DocumentType;
  title: string;
  description: string | null;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  uploader?: Profile;
}

export interface ConsentForm {
  id: string;
  patient_id: string;
  form_type: string;
  signed: boolean;
  signed_at: string | null;
  signed_by_name: string | null;
  ip_address: string | null;
  document_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  patient_id: string | null;
  subject: string | null;
  body: string;
  status: MessageStatus;
  read_at: string | null;
  parent_id: string | null;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  patient_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: Profile;
}

// ─── Database type map for Supabase generics ────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      patients: { Row: Patient; Insert: Partial<Patient>; Update: Partial<Patient> };
      care_team: { Row: CareTeamMember; Insert: Partial<CareTeamMember>; Update: Partial<CareTeamMember> };
      appointments: { Row: Appointment; Insert: Partial<Appointment>; Update: Partial<Appointment> };
      clinical_notes: { Row: ClinicalNote; Insert: Partial<ClinicalNote>; Update: Partial<ClinicalNote> };
      vitals: { Row: Vitals; Insert: Partial<Vitals>; Update: Partial<Vitals> };
      allergies: { Row: Allergy; Insert: Partial<Allergy>; Update: Partial<Allergy> };
      immunizations: { Row: Immunization; Insert: Partial<Immunization>; Update: Partial<Immunization> };
      prescriptions: { Row: Prescription; Insert: Partial<Prescription>; Update: Partial<Prescription> };
      lab_orders: { Row: LabOrder; Insert: Partial<LabOrder>; Update: Partial<LabOrder> };
      lab_results: { Row: LabResult; Insert: Partial<LabResult>; Update: Partial<LabResult> };
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> };
      documents: { Row: Document; Insert: Partial<Document>; Update: Partial<Document> };
      consent_forms: { Row: ConsentForm; Insert: Partial<ConsentForm>; Update: Partial<ConsentForm> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
  };
};
