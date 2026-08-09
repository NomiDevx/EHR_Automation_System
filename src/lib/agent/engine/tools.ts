import { createAdminClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/notifications';

export interface DoctorRecord {
  id: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  department?: string;
}

export interface PatientRecord {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  mrn?: string;
  user_id?: string;
  email?: string;
  phone?: string;
  gender?: string;
}

export async function lookupPatientByUserId(userId: string): Promise<PatientRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, date_of_birth, mrn, profile_id, email, phone, gender')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      dob: data.date_of_birth,
      mrn: data.mrn,
      user_id: data.profile_id,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
    } as PatientRecord;
  } catch (err) {
    console.error('[lookupPatientByUserId] Error:', err);
    return null;
  }
}

export async function lookupPatientByNameDob(name: string, dob: string): Promise<PatientRecord | null> {
  try {
    const supabase = createAdminClient();
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || firstName;

    let query = supabase.from('patients').select('id, first_name, last_name, dob, mrn, user_id');

    if (dob) {
      query = query.eq('dob', dob);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    // Fuzzy match on name
    const lowerName = name.toLowerCase();
    const match = data.find((p: any) => {
      const full = `${p.first_name} ${p.last_name}`.toLowerCase();
      return full.includes(lowerName) || lowerName.includes(p.first_name.toLowerCase());
    });

    return (match || data[0]) as PatientRecord;
  } catch (err) {
    console.error('[lookupPatientByNameDob] Error:', err);
    return null;
  }
}

export async function listDoctors(): Promise<DoctorRecord[]> {
  try {
    const supabase = createAdminClient();

    // Doctors are stored in profiles with role='doctor'
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, specialty')
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (error) {
      console.warn('[listDoctors] Query error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[listDoctors] No active doctors found in profiles table.');
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      first_name: p.first_name || 'Doctor',
      last_name: p.last_name || '',
      specialty: p.specialty || 'General Practice',
    }));
  } catch (err) {
    console.error('[listDoctors] Error:', err);
    return [];
  }
}

export async function getAvailableSlots(providerId?: string): Promise<string[]> {
  try {
    const now = new Date();
    const slots: string[] = [];

    // Scan up to 10 days ahead to ensure we get 4 weekday slots even across weekends
    for (let dayOffset = 1; dayOffset <= 10 && slots.length < 4; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);

      // Skip weekends
      const day = targetDate.getDay();
      if (day === 0 || day === 6) continue;

      const morning = new Date(targetDate);
      morning.setHours(9, 0, 0, 0);
      slots.push(morning.toISOString());

      if (slots.length < 4) {
        const afternoon = new Date(targetDate);
        afternoon.setHours(14, 0, 0, 0);
        slots.push(afternoon.toISOString());
      }
    }

    return slots;
  } catch (err) {
    console.error('[getAvailableSlots] Error:', err);
    return [];
  }
}

export async function bookAppointment(params: {
  patientId: string;
  doctorId?: string;
  slotIso: string;
  appointmentType?: string;
  chiefComplaint?: string;
}): Promise<{ success: boolean; appointmentId?: string; reason?: string }> {
  try {
    const supabase = createAdminClient();

    // ── Normalize appointment type ─────────────────────────────────────────
    const VALID_TYPES = new Set(['new_patient', 'follow_up', 'urgent', 'telehealth', 'wellness']);
    const TYPE_MAP: Record<string, string> = {
      'office visit': 'follow_up',
      'office': 'follow_up',
      'regular': 'follow_up',
      'general': 'follow_up',
      'checkup': 'wellness',
      'check up': 'wellness',
      'check-up': 'wellness',
      'annual': 'wellness',
      'annual checkup': 'wellness',
      'wellness checkup': 'wellness',
      'new patient': 'new_patient',
      'new patient visit': 'new_patient',
      'first visit': 'new_patient',
      'video': 'telehealth',
      'virtual': 'telehealth',
      'online': 'telehealth',
      'video call': 'telehealth',
      'same day': 'urgent',
      'same-day': 'urgent',
      'urgent care': 'urgent',
      'emergency': 'urgent',
    };
    const rawType = (params.appointmentType || '').toLowerCase().trim();
    let resolvedType: string;
    if (VALID_TYPES.has(rawType)) {
      resolvedType = rawType;
    } else if (TYPE_MAP[rawType]) {
      resolvedType = TYPE_MAP[rawType];
      console.log(`[bookAppointment] Normalized appointment_type "${rawType}" → "${resolvedType}"`);
    } else {
      resolvedType = 'follow_up'; // safe default
      console.warn(`[bookAppointment] Unknown appointment_type "${rawType}", defaulting to follow_up`);
    }

    // ── Resolve doctor ID ─────────────────────────────────────────────────
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let doctorId = params.doctorId;

    if (doctorId && !UUID_RE.test(doctorId)) {
      // Not a UUID — try to match by name from the real doctor list
      console.warn('[bookAppointment] Non-UUID doctor_id received, attempting name match. Got:', doctorId);
      const allDoctors = await listDoctors();
      const needle = doctorId.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      const matched = allDoctors.find((d) => {
        const full = `${d.first_name} ${d.last_name}`.toLowerCase();
        return needle.includes(d.first_name.toLowerCase()) ||
               needle.includes(d.last_name.toLowerCase()) ||
               full.includes(needle);
      });
      if (matched) {
        console.log(`[bookAppointment] Matched doctor name to UUID: ${matched.first_name} ${matched.last_name} → ${matched.id}`);
        doctorId = matched.id;
      } else {
        console.warn('[bookAppointment] No name match found, using first available doctor.');
        doctorId = allDoctors[0]?.id;
      }
    } else if (!doctorId) {
      const docs = await listDoctors();
      doctorId = docs[0]?.id;
    }

    if (!doctorId) {
      return { success: false, reason: 'No available doctors found. Please try again later or call the clinic.' };
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: params.patientId,
        provider_id: doctorId,
        scheduled_at: params.slotIso,
        duration_mins: 30,
        type: resolvedType,
        status: 'scheduled',
        chief_complaint: params.chiefComplaint || 'Booked via AI Assistant',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[bookAppointment] Supabase insert error:', error);
      return { success: false, reason: error.message };
    }

    // Trigger n8n notification webhook
    try {
      const { triggerWebhookForAppointment } = await import('@/app/actions');
      await triggerWebhookForAppointment(data.id);
    } catch (whErr: any) {
      console.error('[bookAppointment] Webhook trigger error:', whErr.message);
    }

    // Send confirmation email
    try {
      const supabaseForEmail = createAdminClient();

      // Fetch appointment + patient (same pattern that works in actions.ts)
      const { data: apptFull, error: apptErr } = await supabaseForEmail
        .from('appointments')
        .select('*, patient:patients(*)')
        .eq('id', data.id)
        .maybeSingle();

      if (apptErr) {
        console.error('[bookAppointment] Email fetch error:', apptErr.message);
      } else if (apptFull) {
        // Fetch provider profile separately
        let providerProfile: any = null;
        if (doctorId) {
          const { data: prov } = await supabaseForEmail
            .from('profiles')
            .select('first_name, last_name, email, specialty')
            .eq('id', doctorId)
            .maybeSingle();
          if (prov) providerProfile = prov;
        }

        notificationService
          .sendAppointmentConfirmation({ ...apptFull, provider: providerProfile })
          .catch((e: any) => console.error('[bookAppointment] sendAppointmentConfirmation failed:', e?.message));
      } else {
        console.warn('[bookAppointment] No appointment record found for email, id:', data.id);
      }
    } catch (emailErr: any) {
      console.error('[bookAppointment] Email notification error:', emailErr.message);
    }

    return { success: true, appointmentId: data.id };
  } catch (err: any) {
    console.error('[bookAppointment] Error:', err);
    return { success: false, reason: err.message || 'Database error' };
  }
}

export async function getUpcomingAppointments(userId?: string, patientId?: string): Promise<any[]> {
  try {
    const supabase = createAdminClient();
    let pId = patientId;

    if (!pId && userId) {
      const p = await lookupPatientByUserId(userId);
      if (p) pId = p.id;
    }

    if (!pId) return [];

    const { data, error } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_mins, type, status, chief_complaint, provider_id')
      .eq('patient_id', pId)
      .gte('scheduled_at', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    if (error || !data) return [];

    // Fetch provider names separately
    const results = await Promise.all(
      data.map(async (a: any) => {
        let doctorName = 'Doctor';
        if (a.provider_id) {
          const { data: p } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', a.provider_id)
            .maybeSingle();
          if (p) doctorName = `Dr. ${p.first_name} ${p.last_name}`;
        }
        return {
          id: a.id,
          scheduled_at: a.scheduled_at,
          start_time: a.scheduled_at, // alias for compatibility
          duration_mins: a.duration_mins,
          type: a.type,
          status: a.status,
          chief_complaint: a.chief_complaint,
          doctor_name: doctorName,
          provider_id: a.provider_id,
        };
      })
    );

    return results;
  } catch (err) {
    console.error('[getUpcomingAppointments] Error:', err);
    return [];
  }
}

export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    return !error;
  } catch (err) {
    console.error('[cancelAppointment] Error:', err);
    return false;
  }
}

export async function rescheduleAppointment(appointmentId: string, newSlotIso: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('appointments')
      .update({
        scheduled_at: newSlotIso,
        duration_mins: 30,
        status: 'scheduled',
      })
      .eq('id', appointmentId);

    if (error) {
      console.error('[rescheduleAppointment] Supabase error:', error);
      return false;
    }

    // Send reschedule email
    try {
      const supabaseForEmail = createAdminClient();

      // Fetch appointment + patient (two-query pattern, same as actions.ts)
      const { data: updatedAppt, error: fetchErr } = await supabaseForEmail
        .from('appointments')
        .select('*, patient:patients(*)')
        .eq('id', appointmentId)
        .maybeSingle();

      if (fetchErr) {
        console.error('[rescheduleAppointment] Email fetch error:', fetchErr.message);
      } else if (updatedAppt) {
        let providerProfile: any = null;
        if (updatedAppt.provider_id) {
          const { data: prov } = await supabaseForEmail
            .from('profiles')
            .select('first_name, last_name, email, specialty')
            .eq('id', updatedAppt.provider_id)
            .maybeSingle();
          if (prov) providerProfile = prov;
        }

        notificationService
          .sendAppointmentUpdate({ ...updatedAppt, provider: providerProfile }, 'rescheduled')
          .catch((e: any) => console.error('[rescheduleAppointment] sendAppointmentUpdate failed:', e?.message));
      } else {
        console.warn('[rescheduleAppointment] No appointment record found for email, id:', appointmentId);
      }
    } catch (emailErr: any) {
      console.error('[rescheduleAppointment] Email notification error:', emailErr.message);
    }

    return true;
  } catch (err) {
    console.error('[rescheduleAppointment] Error:', err);
    return false;
  }
}

export async function getPatientHistorySummary(userId?: string): Promise<string> {
  try {
    if (!userId) return 'No user account linked to retrieve records.';
    const supabase = createAdminClient();

    const patient = await lookupPatientByUserId(userId);
    if (!patient) return 'No patient record found for your account.';

    // Fetch medical records / vitals / conditions
    const { data: conditions } = await supabase
      .from('medical_records')
      .select('diagnosis, status, created_at')
      .eq('patient_id', patient.id)
      .limit(5);

    const { data: appts } = await supabase
      .from('appointments')
      .select('scheduled_at, type, status')
      .eq('patient_id', patient.id)
      .order('scheduled_at', { ascending: false })
      .limit(3);

    let summary = `Patient: ${patient.first_name} ${patient.last_name} (DOB: ${patient.dob})\n`;
    if (conditions && conditions.length > 0) {
      summary += `Recent Medical Conditions: ${conditions.map((c: any) => c.diagnosis).join(', ')}\n`;
    }
    if (appts && appts.length > 0) {
      summary += `Recent Appointments: ${appts.map((a: any) => `${a.type} on ${new Date(a.scheduled_at).toLocaleDateString()}`).join(', ')}`;
    }

    return summary;
  } catch (err) {
    console.error('[getPatientHistorySummary] Error:', err);
    return 'Medical history unavailable.';
  }
}

export async function saveChatLog(params: {
  sessionId: string;
  senderRole: 'user' | 'agent';
  messageText: string;
  userId?: string;
  patientId?: string;
  currentNode?: string;
  options?: string[];
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from('agent_chat_logs').insert({
      session_id: params.sessionId,
      sender_role: params.senderRole,
      message_text: params.messageText,
      user_id: params.userId || null,
      patient_id: params.patientId || null,
      current_node: params.currentNode || null,
      options: params.options || null,
    });
  } catch (err) {
    // Non-blocking log insertion error
    console.error('[saveChatLog] Error:', err);
  }
}


// ─── Lab Results ─────────────────────────────────────────────────────────────

export interface LabResult {
  id: string;
  component_name: string;
  value: string;
  unit?: string;
  reference_low?: string;
  reference_high?: string;
  flag: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  resulted_at: string;
  notes?: string;
  lab_order?: { test_name: string; priority: string; ordered_at: string };
}

export async function getPatientLabResults(
  patientId: string,
  limit = 20,
): Promise<LabResult[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('lab_results')
      .select(
        'id, component_name, value, unit, reference_low, reference_high, flag, resulted_at, notes, ' +
        'lab_order:lab_orders(test_name, priority, ordered_at)',
      )
      .eq('patient_id', patientId)
      .order('resulted_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getPatientLabResults] Error:', error);
      return [];
    }
    return (data || []) as LabResult[];
  } catch (err) {
    console.error('[getPatientLabResults] Error:', err);
    return [];
  }
}


// ─── Medications (Prescriptions) ──────────────────────────────────────────────

export interface Prescription {
  id: string;
  drug_name: string;
  drug_generic_name?: string;
  dosage: string;
  frequency: string;
  route?: string;
  status: 'active' | 'discontinued' | 'completed' | 'on_hold';
  start_date: string;
  end_date?: string;
  refills_remaining?: number;
  instructions?: string;
  prescriber?: { first_name: string; last_name: string; specialty?: string };
}

export async function getPatientMedications(
  patientId: string,
): Promise<{ active: Prescription[]; past: Prescription[] }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('prescriptions')
      .select(
        'id, drug_name, drug_generic_name, dosage, frequency, route, ' +
        'status, start_date, end_date, refills_remaining, instructions, ' +
        'prescriber:profiles!prescriptions_prescriber_id_fkey(first_name, last_name, specialty)',
      )
      .eq('patient_id', patientId)
      .order('start_date', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[getPatientMedications] Error:', error);
      return { active: [], past: [] };
    }

    const rows = (data || []) as Prescription[];
    return {
      active: rows.filter((r) => r.status === 'active'),
      past:   rows.filter((r) => r.status !== 'active'),
    };
  } catch (err) {
    console.error('[getPatientMedications] Error:', err);
    return { active: [], past: [] };
  }
}
