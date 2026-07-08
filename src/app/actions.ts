'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { Gender, AppointmentType } from '@/lib/types/database';

// ─── Auth: Sign Up (bypasses email verification) ───────────────────────────────

export async function signUpPatient(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const adminSupabase = createAdminClient();

    // Create user and immediately confirm email — no verification email needed
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { first_name: firstName, last_name: lastName, role: 'patient' },
      email_confirm: true,   // ← skips email verification entirely
    });

    if (error) {
      return { error: error.message || 'Failed to create account. Please try again.' };
    }

    if (!data?.user) {
      return { error: 'Signup failed — no user returned.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[signUpPatient]', err);
    return { error: err?.message || 'An unexpected error occurred.' };
  }
}


export interface BookingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  providerId: string;
  appointmentType: AppointmentType;
  scheduledAt: string;
  chiefComplaint?: string;
}

export async function bookPublicAppointment(data: BookingInput) {
  const supabase = createAdminClient();

  // 1. Look up if patient already exists by email and date of birth
  const { data: existingPatient, error: lookupError } = await supabase
    .from('patients')
    .select('id, mrn')
    .eq('email', data.email)
    .eq('date_of_birth', data.dateOfBirth)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to lookup patient: ${lookupError.message}`);
  }

  let patientId = existingPatient?.id;
  let mrn = existingPatient?.mrn;

  // Link profile_id if it exists now
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.email)
    .maybeSingle();

  // 2. If patient does not exist, create a new one
  if (!patientId) {
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        profile_id: profile?.id || null,
        is_active: true,
        consent_obtained: true,
        consent_date: new Date().toISOString(),
      })
      .select('id, mrn')
      .single();

    if (createError) {
      throw new Error(`Failed to register patient: ${createError.message}`);
    }

    patientId = newPatient.id;
    mrn = newPatient.mrn;
  } else if (profile && !existingPatient?.id) {
    // Link existing patient if profile wasn't linked
    await supabase
      .from('patients')
      .update({ profile_id: profile.id })
      .eq('id', patientId);
  }

  // 3. Create the appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      provider_id: data.providerId,
      type: data.appointmentType,
      status: 'scheduled',
      scheduled_at: data.scheduledAt,
      duration_mins: 30,
      chief_complaint: data.chiefComplaint || null,
    })
    .select('id')
    .single();

  if (appointmentError) {
    throw new Error(`Failed to create appointment: ${appointmentError.message}`);
  }

  // 4. Trigger n8n notification webhook in background
  try {
    await triggerWebhookForAppointment(appointment.id);
  } catch (err: any) {
    console.error('Error triggering webhook:', err.message);
  }

  return { success: true, appointmentId: appointment.id, mrn };
}

// ─── System Settings Webhook Handlers ──────────────────────────────────────────

export async function getWebhookUrl() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'webhook_url')
      .maybeSingle();

    if (error) {
      console.warn('System settings table or webhook_url not yet available in DB:', error.message);
      return '';
    }
    return data?.value || '';
  } catch (err: any) {
    console.error('Failed to get webhook URL:', err.message);
    return '';
  }
}

export async function saveWebhookUrl(url: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key: 'webhook_url', value: url, updated_at: new Date().toISOString() })
    .eq('key', 'webhook_url');

  if (error) {
    throw new Error(`Failed to save webhook URL: ${error.message}`);
  }
  return { success: true };
}

export async function triggerWebhookForAppointment(appointmentId: string) {
  try {
    const supabase = createAdminClient();
    const webhookUrl = await getWebhookUrl();
    if (!webhookUrl) {
      return { success: false, reason: 'No Webhook URL configured' };
    }

    const { data: appt, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), provider:profiles(*)')
      .eq('id', appointmentId)
      .single();

    if (error || !appt) {
      console.error('Failed to fetch appointment details for webhook:', error?.message);
      return { success: false, reason: 'Appointment not found' };
    }

    const payload = {
      appointment_id: appt.id,
      patient_name: `${appt.patient?.first_name} ${appt.patient?.last_name}`,
      patient_email: appt.patient?.email || '',
      patient_phone: appt.patient?.phone || '',
      patient_dob: appt.patient?.date_of_birth || '',
      doctor_name: `Dr. ${appt.provider?.first_name} ${appt.provider?.last_name}`,
      doctor_email: appt.provider?.email || '',
      doctor_specialty: appt.provider?.specialty || 'General Practitioner',
      doctor_department: appt.provider?.department || 'Clinical Care',
      visit_type: appt.type,
      scheduled_at: appt.scheduled_at,
      duration_mins: appt.duration_mins,
      chief_complaint: appt.chief_complaint || '',
      portal_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    };

    // Perform the POST webhook trigger in background
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((fetchErr) => {
      console.error('Webhook fetch failed:', fetchErr.message);
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to execute triggerWebhookForAppointment:', err.message);
    return { success: false, error: err.message };
  }
}
