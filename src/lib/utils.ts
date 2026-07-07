import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, differenceInYears } from 'date-fns';
import type { UserRole, LabResultFlag, AllergySeverity, AppointmentStatus, PrescriptionStatus, BillingStatus } from './types/database';

// ─── Tailwind utility ────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ────────────────────────────────────────────────────────────
export function formatDate(date: string | Date | null, fmt = 'MMM d, yyyy') {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date | null) {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date | null) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function calculateAge(dob: string | null): number {
  if (!dob) return 0;
  return differenceInYears(new Date(), parseISO(dob));
}

// ─── Money helpers ───────────────────────────────────────────────────────────
export function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// ─── Role helpers ────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Physician',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  patient: 'Patient',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  doctor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  nurse: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  receptionist: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  patient: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export function isStaff(role: UserRole) {
  return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
}

export function isClinician(role: UserRole) {
  return ['admin', 'doctor', 'nurse'].includes(role);
}

// ─── Status display ──────────────────────────────────────────────────────────
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  completed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  no_show: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export const LAB_FLAG_COLORS: Record<LabResultFlag, string> = {
  normal: 'text-emerald-400',
  low: 'text-amber-400',
  high: 'text-amber-400',
  critical_low: 'text-red-400',
  critical_high: 'text-red-400',
};

export const ALLERGY_SEVERITY_COLORS: Record<AllergySeverity, string> = {
  mild: 'bg-blue-500/20 text-blue-300',
  moderate: 'bg-amber-500/20 text-amber-300',
  severe: 'bg-orange-500/20 text-orange-300',
  life_threatening: 'bg-red-500/20 text-red-300',
};

export const PRESCRIPTION_STATUS_COLORS: Record<PrescriptionStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  discontinued: 'bg-slate-500/20 text-slate-300',
  completed: 'bg-blue-500/20 text-blue-300',
  on_hold: 'bg-amber-500/20 text-amber-300',
};

export const BILLING_STATUS_COLORS: Record<BillingStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  submitted: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-emerald-500/20 text-emerald-300',
  partially_paid: 'bg-amber-500/20 text-amber-300',
  denied: 'bg-red-500/20 text-red-300',
  void: 'bg-slate-600/20 text-slate-400',
};

// ─── Text helpers ────────────────────────────────────────────────────────────
export function humanizeLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function patientFullName(patient: { first_name: string; last_name: string }) {
  return `${patient.first_name} ${patient.last_name}`;
}
