import { createAdminClient } from '@/lib/supabase/server';

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
}

export async function lookupPatientByUserId(userId: string): Promise<PatientRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, dob, mrn, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as PatientRecord;
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
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        specialty,
        department,
        profiles!inner (
          first_name,
          last_name
        )
      `);

    if (error || !doctors) {
      console.warn('[listDoctors] Supabase query returned no doctors or error:', error);
      return [
        { id: 'doc-1', first_name: 'Sarah', last_name: 'Smith', specialty: 'General Practice' },
        { id: 'doc-2', first_name: 'Robert', last_name: 'Johnson', specialty: 'Cardiology' },
        { id: 'doc-3', first_name: 'Emily', last_name: 'Davis', specialty: 'Internal Medicine' },
      ];
    }

    return doctors.map((d: any) => ({
      id: d.id,
      first_name: d.profiles?.first_name || 'Doctor',
      last_name: d.profiles?.last_name || '',
      specialty: d.specialty || d.department || 'General Practice',
    }));
  } catch (err) {
    console.error('[listDoctors] Error:', err);
    return [
      { id: 'doc-1', first_name: 'Sarah', last_name: 'Smith', specialty: 'General Practice' },
      { id: 'doc-2', first_name: 'Robert', last_name: 'Johnson', specialty: 'Cardiology' },
    ];
  }
}

export async function getAvailableSlots(providerId?: string): Promise<string[]> {
  try {
    const now = new Date();
    const slots: string[] = [];

    // Generate 4 upcoming slot datetimes starting tomorrow
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);

      // Avoid weekends
      if (targetDate.getDay() === 0 || targetDate.getDay() === 6) continue;

      const hour1 = new Date(targetDate);
      hour1.setHours(9, 30, 0, 0);
      slots.push(hour1.toISOString());

      const hour2 = new Date(targetDate);
      hour2.setHours(14, 0, 0, 0);
      slots.push(hour2.toISOString());
    }

    return slots.slice(0, 4);
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
}): Promise<{ success: boolean; appointmentId?: string; reason?: string }> {
  try {
    const supabase = createAdminClient();

    // Default to first active doctor if doctorId not specified
    let doctorId = params.doctorId;
    if (!doctorId) {
      const docs = await listDoctors();
      doctorId = docs[0]?.id;
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: params.patientId,
        doctor_id: doctorId,
        start_time: params.slotIso,
        end_time: new Date(new Date(params.slotIso).getTime() + 30 * 60000).toISOString(),
        type: params.appointmentType || 'follow_up',
        status: 'scheduled',
        reason: 'Booked via AI Assistant',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[bookAppointment] Supabase insert error:', error);
      return { success: false, reason: error.message };
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
      .select(`
        id,
        start_time,
        end_time,
        type,
        status,
        reason,
        doctors (
          profiles (first_name, last_name)
        )
      `)
      .eq('patient_id', pId)
      .gte('start_time', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true });

    if (error || !data) return [];

    return data.map((a: any) => ({
      id: a.id,
      start_time: a.start_time,
      type: a.type,
      doctor_name: a.doctors?.profiles
        ? `Dr. ${a.doctors.profiles.first_name} ${a.doctors.profiles.last_name}`
        : 'Doctor',
    }));
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
    const endTime = new Date(new Date(newSlotIso).getTime() + 30 * 60000).toISOString();

    const { error } = await supabase
      .from('appointments')
      .update({
        start_time: newSlotIso,
        end_time: endTime,
        status: 'scheduled',
      })
      .eq('id', appointmentId);

    return !error;
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
      .select('start_time, type, status')
      .eq('patient_id', patient.id)
      .order('start_time', { ascending: false })
      .limit(3);

    let summary = `Patient: ${patient.first_name} ${patient.last_name} (DOB: ${patient.dob})\n`;
    if (conditions && conditions.length > 0) {
      summary += `Recent Medical Conditions: ${conditions.map((c: any) => c.diagnosis).join(', ')}\n`;
    }
    if (appts && appts.length > 0) {
      summary += `Recent Appointments: ${appts.map((a: any) => `${a.type} on ${new Date(a.start_time).toLocaleDateString()}`).join(', ')}`;
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
