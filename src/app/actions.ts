'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
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

  // ── 1. Look up existing patient (email+DOB, or profile_id link) ──────────
  // Fetch the portal profile first so we can cross-check by profile_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.email)
    .maybeSingle();

  // Try email+DOB lookup first
  const { data: existingPatient, error: lookupError } = await supabase
    .from('patients')
    .select('id, mrn, profile_id')
    .eq('email', data.email)
    .eq('date_of_birth', data.dateOfBirth)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to lookup patient: ${lookupError.message}`);
  }

  // Also try profile_id lookup (handles portal users whose DOB may not match
  // the stored record exactly, or who registered via a different path)
  let profileLinkedPatient: { id: string; mrn: string; profile_id: string | null } | null = null;
  if (!existingPatient && profile?.id) {
    const { data: byProfile } = await supabase
      .from('patients')
      .select('id, mrn, profile_id')
      .eq('profile_id', profile.id)
      .maybeSingle();
    profileLinkedPatient = byProfile ?? null;
  }

  let patientId: string | undefined = existingPatient?.id ?? profileLinkedPatient?.id;
  let mrn: string | undefined = existingPatient?.mrn ?? profileLinkedPatient?.mrn;

  // ── 2. Create patient if none found — retry up to 3× on MRN collision ────
  // The mrn_seq may be behind existing data; nextval() always advances so
  // a second attempt will succeed once the sequence moves past colliding values.
  if (!patientId) {
    let newPatient: { id: string; mrn: string } | null = null;
    let lastCreateError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: inserted, error: createError } = await supabase
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

      if (!createError) {
        newPatient = inserted;
        break;
      }

      // If the error is NOT an MRN unique-constraint violation, fail immediately
      const isMrnConflict =
        createError.code === '23505' &&
        (createError.message.includes('patients_mrn_key') ||
          createError.message.includes('mrn'));

      if (!isMrnConflict) {
        throw new Error(`Failed to register patient: ${createError.message}`);
      }

      lastCreateError = createError;
      console.warn(`[bookPublicAppointment] MRN conflict on attempt ${attempt} — retrying…`);
    }

    if (!newPatient) {
      throw new Error(
        `Failed to register patient after 3 attempts (MRN conflict): ${lastCreateError?.message}`,
      );
    }

    patientId = newPatient.id;
    mrn = newPatient.mrn;
  } else {
    // Ensure the profile_id is linked on the existing record if it wasn't before
    const existingProfileId = existingPatient?.profile_id ?? profileLinkedPatient?.profile_id;
    if (profile?.id && !existingProfileId) {
      await supabase
        .from('patients')
        .update({ profile_id: profile.id })
        .eq('id', patientId);
    }
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
      notification_target: 'doctor',
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

// ─── Patient Self-Logging Actions ──────────────────────────────────────────────

export async function addPatientVital(data: {
  patientId: string;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperatureF?: number | null;
  weightLbs?: number | null;
  heightIn?: number | null;
  painScale?: number | null;
  notes?: string | null;
}) {
  const supabase = createAdminClient();
  const userSupabase = await createClient(); // to verify auth

  // 1. Get authenticated user
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  // 2. Verify that this patient ID belongs to this user
  const { data: patient } = await userSupabase
    .from('patients')
    .select('id')
    .eq('id', data.patientId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!patient) {
    throw new Error('Unauthorized: Patient record not linked to your account');
  }

  // 3. Insert vital using admin client (bypassing RLS insert restriction)
  const { data: newVital, error } = await supabase
    .from('vitals')
    .insert({
      patient_id: data.patientId,
      recorded_by: user.id,
      systolic_bp: data.systolicBp,
      diastolic_bp: data.diastolicBp,
      heart_rate: data.heartRate,
      respiratory_rate: data.respiratoryRate,
      temperature_f: data.temperatureF,
      weight_lbs: data.weightLbs,
      height_in: data.heightIn,
      pain_scale: data.painScale,
      notes: data.notes,
      recorded_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to add vitals: ${error.message}`);
  }

  return { success: true, vital: newVital };
}

export async function addPatientAllergy(data: {
  patientId: string;
  allergen: string;
  reaction?: string | null;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetDate?: string | null;
}) {
  const supabase = createAdminClient();
  const userSupabase = await createClient(); // to verify auth

  // 1. Get authenticated user
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  // 2. Verify that this patient ID belongs to this user
  const { data: patient } = await userSupabase
    .from('patients')
    .select('id')
    .eq('id', data.patientId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!patient) {
    throw new Error('Unauthorized: Patient record not linked to your account');
  }

  // 3. Insert allergy using admin client (bypassing RLS insert restriction)
  const { data: newAllergy, error } = await supabase
    .from('allergies')
    .insert({
      patient_id: data.patientId,
      recorded_by: user.id,
      allergen: data.allergen,
      reaction: data.reaction,
      severity: data.severity,
      onset_date: data.onsetDate || null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to add allergy: ${error.message}`);
  }

  return { success: true, allergy: newAllergy };
}


// ─── Appointment Update (Reschedule / Cancel) ──────────────────────────────────

export interface UpdateAppointmentInput {
  appointmentId: string;
  /** New status to set, e.g. 'cancelled' or 'scheduled' */
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'no_show';
  /** ISO string — provide when rescheduling */
  scheduledAt?: string;
  /** Optional reason / note appended to the appointment notes */
  reason?: string;
}

export async function updateAppointment(
  input: UpdateAppointmentInput,
): Promise<{ success: true } | { error: string }> {
  try {
    const userSupabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Verify authentication
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) return { error: 'Unauthenticated' };

    // 2. Fetch appointment + caller's profile role
    const [{ data: appt, error: apptErr }, { data: callerProfile }] = await Promise.all([
      adminSupabase
        .from('appointments')
        .select('id, patient_id, provider_id, scheduled_at, status, notes, patient:patients(profile_id)')
        .eq('id', input.appointmentId)
        .single(),
      userSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single(),
    ]);

    if (apptErr || !appt) return { error: 'Appointment not found' };

    const callerRole = (callerProfile as any)?.role as string | undefined;
    const isStaff = ['admin', 'doctor', 'nurse', 'receptionist'].includes(callerRole ?? '');

    // 3. Authorisation: staff can edit any appointment;
    //    patients can only edit their own
    if (!isStaff) {
      const patientProfileId = (appt as any).patient?.profile_id;
      if (patientProfileId !== user.id) {
        return { error: 'You are not authorised to modify this appointment' };
      }
    }

    // 4. Build update payload
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.status) updateData.status = input.status;
    if (input.scheduledAt) updateData.scheduled_at = input.scheduledAt;

    if (input.reason?.trim()) {
      const existingNotes = (appt as any).notes || '';
      const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      const prefix = input.status === 'cancelled' ? 'Cancellation reason' : 'Reschedule reason';
      updateData.notes = existingNotes
        ? `${existingNotes}\n\n[${timestamp}] ${prefix}: ${input.reason.trim()}`
        : `[${timestamp}] ${prefix}: ${input.reason.trim()}`;
    }

    // 5. Perform update
    const { error: updateErr } = await adminSupabase
      .from('appointments')
      .update(updateData)
      .eq('id', input.appointmentId);

    if (updateErr) return { error: `Failed to update appointment: ${updateErr.message}` };

    // 6. If rescheduled, re-trigger doctor notification webhook
    if (input.scheduledAt && input.status !== 'cancelled') {
      try {
        await triggerWebhookForAppointment(input.appointmentId);
      } catch (webhookErr: any) {
        console.error('[updateAppointment] Webhook re-trigger failed:', webhookErr.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[updateAppointment]', err);
    return { error: err?.message || 'An unexpected error occurred' };
  }
}
