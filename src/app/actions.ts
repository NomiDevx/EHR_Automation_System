'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { Gender, AppointmentType } from '@/lib/types/database';

// ─── Auth: Sign Up (bypasses email verification) ───────────────────────────────

export async function signUpPatient(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  dateOfBirth?: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const adminSupabase = createAdminClient();

    // 1. Create user and immediately confirm email — no verification email needed
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'patient',
        date_of_birth: dateOfBirth,
      },
      email_confirm: true,
    });

    if (error) {
      return { error: error.message || 'Failed to create account. Please try again.' };
    }

    if (!data?.user) {
      return { error: 'Signup failed — no user returned.' };
    }

    const userId = data.user.id;
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const dob = dateOfBirth || '1990-01-01';

    // 2. Ensure profiles table row exists with exact first_name, last_name & email
    await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: cleanFirst,
        last_name: cleanLast,
        role: 'patient',
        is_active: true,
      }, { onConflict: 'id' });

    // 3. Create or link patients table record with DOB
    const { data: existingPat } = await adminSupabase
      .from('patients')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!existingPat) {
      await adminSupabase
        .from('patients')
        .insert({
          profile_id: userId,
          first_name: cleanFirst,
          last_name: cleanLast,
          email: email,
          date_of_birth: dob,
          gender: 'other',
          is_active: true,
          consent_obtained: true,
          consent_date: new Date().toISOString(),
        });
    } else {
      await adminSupabase
        .from('patients')
        .update({
          first_name: cleanFirst,
          last_name: cleanLast,
          date_of_birth: dob,
          email: email,
        })
        .eq('id', existingPat.id);
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

    const { data: appt, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('id', appointmentId)
      .single();

    if (error || !appt) {
      console.error('Failed to fetch appointment details for webhook:', error?.message);
      return { success: false, reason: 'Appointment not found' };
    }

    // Fetch provider profile directly by provider_id
    let provider: any = null;
    if (appt.provider_id) {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', appt.provider_id)
        .maybeSingle();
      if (p) provider = p;
    }

    const dbWebhookUrl = await getWebhookUrl();
    const webhookUrl = dbWebhookUrl || process.env.N8N_WEBHOOK_URL || 'https://simadi6690.app.n8n.cloud/webhook-test/book-appointment';

    const payload = {
      appointment_id: appt.id,
      notification_target: 'doctor',
      patient_name: `${appt.patient?.first_name || ''} ${appt.patient?.last_name || ''}`.trim() || 'Patient',
      patient_email: appt.patient?.email || '',
      patient_phone: appt.patient?.phone || '',
      patient_dob: appt.patient?.date_of_birth || '',
      doctor_name: provider ? `Dr. ${provider.first_name || ''} ${provider.last_name || ''}`.trim() : 'Doctor',
      doctor_email: provider?.email || '',
      doctor_specialty: provider?.specialty || 'General Practitioner',
      doctor_department: provider?.department || 'Clinical Care',
      visit_type: appt.type,
      scheduled_at: appt.scheduled_at,
      duration_mins: appt.duration_mins,
      chief_complaint: appt.chief_complaint || '',
      portal_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    };

    console.log(`[Webhook Trigger] Sending payload to ${webhookUrl}:`, payload);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(`Webhook trigger returned status ${res.status}: ${res.statusText}`);
      } else {
        console.log(`Webhook triggered successfully to ${webhookUrl}`);
      }
      return { success: true };
    } catch (fetchErr: any) {
      console.error('Webhook fetch failed:', fetchErr.message);
      return { success: false, reason: fetchErr.message };
    }
  } catch (err: any) {
    console.error('Failed to execute triggerWebhookForAppointment:', err.message);
    return { success: false, reason: err.message };
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

// ─── Admin User Management Actions ──────────────────────────────────────────────

export async function adminCreateUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient';
  phone?: string;
  specialty?: string;
  department?: string;
  npiNumber?: string;
}): Promise<{ success: true; userId: string } | { error: string }> {
  try {
    const adminSupabase = createAdminClient();

    // Verify requesting user is admin
    const userSupabase = await createClient();
    const { data: { user: requester } } = await userSupabase.auth.getUser();
    if (!requester) return { error: 'Unauthenticated' };
    const { data: reqProfile } = await userSupabase.from('profiles').select('role').eq('id', requester.id).single();
    if ((reqProfile as any)?.role !== 'admin') {
      return { error: 'Unauthorized: Admins only' };
    }

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password || 'TempPassword@123',
      user_metadata: { first_name: data.firstName, last_name: data.lastName, role: data.role },
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      return { error: authError?.message || 'Failed to create user' };
    }

    const userId = authData.user.id;

    // Update public.profiles with the extra fields (since the trigger handle_new_user only covers first_name, last_name, role)
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        phone: data.phone || null,
        specialty: data.specialty || null,
        department: data.department || null,
        npi_number: data.npiNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      return { error: `User authenticated but profile update failed: ${profileError.message}` };
    }

    // Log this action to audit logs
    await adminSupabase.from('audit_logs').insert({
      actor_id: requester.id,
      action: 'create',
      table_name: 'profiles',
      record_id: userId,
      changes: { new: { email: data.email, role: data.role } },
    });

    return { success: true, userId };
  } catch (err: any) {
    console.error('[adminCreateUser]', err);
    return { error: err?.message || 'An unexpected error occurred' };
  }
}

export async function adminUpdateUser(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient';
    phone?: string;
    specialty?: string;
    department?: string;
    npiNumber?: string;
    isActive: boolean;
  }
): Promise<{ success: true } | { error: string }> {
  try {
    const adminSupabase = createAdminClient();

    // Verify requesting user is admin
    const userSupabase = await createClient();
    const { data: { user: requester } } = await userSupabase.auth.getUser();
    if (!requester) return { error: 'Unauthenticated' };
    const { data: reqProfile } = await userSupabase.from('profiles').select('role').eq('id', requester.id).single();
    if ((reqProfile as any)?.role !== 'admin') {
      return { error: 'Unauthorized: Admins only' };
    }

    // Prevent self-deactivation or self-demotion
    if (requester.id === userId) {
      if (!data.isActive) {
        return { error: 'Cannot deactivate your own admin account' };
      }
      if (data.role !== 'admin') {
        return { error: 'Cannot change your own role' };
      }
    }

    // Update profiles first
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        phone: data.phone || null,
        specialty: data.specialty || null,
        department: data.department || null,
        npi_number: data.npiNumber || null,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      return { error: `Failed to update profile: ${profileError.message}` };
    }

    // Update GoTrue auth user (metadata and ban status)
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: { first_name: data.firstName, last_name: data.lastName, role: data.role },
      ban_duration: data.isActive ? 'none' : 'infinite',
    });

    if (authError) {
      return { error: `Profile updated, but auth sync failed: ${authError.message}` };
    }

    // Log to audit logs
    await adminSupabase.from('audit_logs').insert({
      actor_id: requester.id,
      action: 'update',
      table_name: 'profiles',
      record_id: userId,
      changes: { new: { role: data.role, is_active: data.isActive } },
    });

    return { success: true };
  } catch (err: any) {
    console.error('[adminUpdateUser]', err);
    return { error: err?.message || 'An unexpected error occurred' };
  }
}

export async function getSystemActivityStats(): Promise<{ date: string; count: number }[]> {
  try {
    const supabase = createAdminClient();

    // Verify requesting user is admin
    const userSupabase = await createClient();
    const { data: { user: requester } } = await userSupabase.auth.getUser();
    if (!requester) throw new Error('Unauthenticated');
    const { data: reqProfile } = await userSupabase.from('profiles').select('role').eq('id', requester.id).single();
    if ((reqProfile as any)?.role !== 'admin') {
      throw new Error('Unauthorized: Admins only');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }

    // Initialize counts for the last 7 days
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    // Populate counts from logs
    logs?.forEach((log: { created_at: string }) => {
      const dateStr = log.created_at.split('T')[0];
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++;
      }
    });

    // Format for Recharts
    const result = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  } catch (err: any) {
    console.error('[getSystemActivityStats]', err);
    return [];
  }
}

// ─── Chat History Action ──────────────────────────────────────────────────────

export async function getUserChatHistory(): Promise<{
  sessionId: string;
  createdAt: string;
  messages: {
    id: string;
    senderRole: 'user' | 'agent';
    text: string;
    createdAt: string;
  }[];
}[]> {
  try {
    const userSupabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) return [];

    const { data: logs, error } = await adminSupabase
      .from('agent_chat_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !logs || logs.length === 0) return [];

    // Group logs by session_id
    const sessionsMap: Record<string, {
      sessionId: string;
      createdAt: string;
      messages: { id: string; senderRole: 'user' | 'agent'; text: string; createdAt: string }[];
    }> = {};

    for (const log of logs) {
      const sid = log.session_id;
      if (!sessionsMap[sid]) {
        sessionsMap[sid] = {
          sessionId: sid,
          createdAt: log.created_at,
          messages: [],
        };
      }
      sessionsMap[sid].messages.push({
        id: log.id,
        senderRole: log.sender_role as 'user' | 'agent',
        text: log.message_text,
        createdAt: log.created_at,
      });
    }

    return Object.values(sessionsMap).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err: any) {
    console.error('[getUserChatHistory]', err);
    return [];
  }
}


// ─── Password Change ──────────────────────────────────────────────────────────

export async function changePassword(
  newPassword: string,
): Promise<{ success: true } | { error: string }> {
  try {
    if (!newPassword || newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'You must be logged in to change your password.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { error: error.message || 'Failed to update password. Please try again.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[changePassword]', err);
    return { error: err?.message || 'An unexpected error occurred.' };
  }
}


// ─── Patient Profile Update ───────────────────────────────────────────────────

export async function updatePatientProfile(data: {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
}): Promise<{ success: true } | { error: string }> {
  try {
    const { firstName, lastName, dateOfBirth } = data;

    if (!firstName.trim() || !lastName.trim()) {
      return { error: 'First name and last name are required.' };
    }
    if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return { error: 'Date of birth must be in YYYY-MM-DD format.' };
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'You must be logged in to update your profile.' };
    }

    // Update the patients table (linked by profile_id)
    const { error: patientError } = await adminSupabase
      .from('patients')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth,
      })
      .eq('profile_id', user.id);

    if (patientError) {
      return { error: patientError.message || 'Failed to update profile.' };
    }

    // Also sync the profiles table so the sidebar name updates
    await adminSupabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      .eq('id', user.id);

    return { success: true };
  } catch (err: any) {
    console.error('[updatePatientProfile]', err);
    return { error: err?.message || 'An unexpected error occurred.' };
  }
}
